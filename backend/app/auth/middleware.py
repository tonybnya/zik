"""
Script Name : middleware.py
Description : Request-scoped auth. Two modes:

                AUTH_MODE=stub   — reads X-Stub-User-Id / X-Stub-User-Email
                                   headers (dev only, bypasses real auth).
                AUTH_MODE=clerk  — verifies an Authorization: Bearer JWT
                                   using Clerk's JWKS public key (prod).

              Exposes:
                current_user()  — Flask view helper; raises ApiError(401)
                                   if no user is on the request.
                require_user    — decorator that wraps a view to require
                                   authentication.
                resolve_user    — internal: turn a (clerk_id, email) pair
                                   into a User row, creating it on first
                                   use (idempotent upsert).

Author      : @tonybnya
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any

from flask import g, request

from app.errors import ApiError
from app.extensions import db
from app.models import User

if TYPE_CHECKING:
    from flask import Flask

log = logging.getLogger(__name__)


def _stub_credentials() -> tuple[str, str] | None:
    clerk_id = request.headers.get("X-Stub-User-Id")
    email = request.headers.get("X-Stub-User-Email")
    if not clerk_id or not email:
        return None
    return clerk_id, email


def _clerk_credentials() -> tuple[str, str] | None:
    """Verify a Clerk-issued JWT and extract (clerk_id, email).

    Returns None when no Authorization header is present. Raises 401 if a
    header IS present but the token is invalid. The real JWKS verification
    is wired in Phase 14 (deployment); the seam is here.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.removeprefix("Bearer ").strip()
    if not token:
        return None
    raise ApiError(
        "Clerk JWT verification is not yet wired. "
        "Set AUTH_MODE=stub for local dev or implement the JWKS path.",
        status_code=501,
        code="clerk_not_implemented",
    )


def resolve_user(clerk_id: str, email: str) -> User:
    """Look up the user by clerk_id; create on first use."""
    user = db.session.query(User).filter_by(clerk_id=clerk_id).one_or_none()
    if user is None:
        user = User(clerk_id=clerk_id, email=email)
        user.save(db.session)
        db.session.commit()
    return user


def _load_user() -> None:
    """Best-effort user loader. Sets g.user if credentials are present and
    valid; otherwise leaves g.user unset. Public routes can ignore g.user;
    protected routes use @require_user to enforce auth.
    """
    mode = _auth_mode()
    creds: tuple[str, str] | None
    if mode == "stub":
        creds = _stub_credentials()
    elif mode == "clerk":
        creds = _clerk_credentials()
    else:
        raise ApiError(
            f"Unknown AUTH_MODE: {mode!r}",
            status_code=500,
            code="misconfigured",
        )
    if creds is None:
        return
    clerk_id, email = creds
    g.user = resolve_user(clerk_id, email)


def _auth_mode() -> str:
    from flask import current_app

    return current_app.config.get("AUTH_MODE", "stub")


def current_user() -> User:
    """Return the authenticated user for this request, or raise 401."""
    user = getattr(g, "user", None)
    if user is None:
        raise ApiError("Not authenticated", status_code=401, code="unauthorized")
    return user


def require_user(view: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator: 401 if no authenticated user is attached."""

    @wraps(view)
    def _wrapped(*args: Any, **kwargs: Any) -> Any:
        current_user()  # raises 401 if missing
        return view(*args, **kwargs)

    return _wrapped


def init_auth(app: "Flask") -> None:
    """Wire the per-request user loader. Call from create_app()."""
    app.before_request(_load_user)

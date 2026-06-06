"""
Script Name : preferences.py
Description : User preferences — preferred genres and moods. One record per
              user, auto-created on first read.
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.auth.middleware import current_user
from app.errors import ApiError
from app.extensions import db
from app.models import Preference

preferences_bp = Blueprint("preferences", __name__, url_prefix="/api/preferences")


def _ensure_preference(user_id: int) -> Preference:
    pref = db.session.execute(
        select(Preference).where(Preference.user_id == user_id)
    ).scalar_one_or_none()
    if pref is None:
        pref = Preference(user_id=user_id)
        pref.save(db.session)
        db.session.commit()
    return pref


@preferences_bp.get("")
def get_preferences():
    """Return the current user's preferences (auto-creates an empty record)."""
    user = current_user()
    pref = _ensure_preference(user.id)
    return jsonify(
        {
            "preferred_genres": list(pref.preferred_genres or []),
            "preferred_moods": list(pref.preferred_moods or []),
            "updated_at": pref.updated_at.isoformat() if pref.updated_at else None,
        }
    )


@preferences_bp.put("")
def update_preferences():
    """Update the current user's preferred genres and/or moods."""
    user = current_user()
    payload = request.get_json(silent=True) or {}

    if "preferred_genres" in payload and not isinstance(
        payload["preferred_genres"], list
    ):
        raise ApiError(
            "preferred_genres must be a list of strings",
            status_code=400,
            code="bad_request",
        )
    if "preferred_moods" in payload and not isinstance(
        payload["preferred_moods"], list
    ):
        raise ApiError(
            "preferred_moods must be a list of strings",
            status_code=400,
            code="bad_request",
        )

    pref = _ensure_preference(user.id)
    if "preferred_genres" in payload:
        pref.preferred_genres = list(payload["preferred_genres"])
    if "preferred_moods" in payload:
        pref.preferred_moods = list(payload["preferred_moods"])
    db.session.commit()

    return jsonify(
        {
            "preferred_genres": list(pref.preferred_genres or []),
            "preferred_moods": list(pref.preferred_moods or []),
            "updated_at": pref.updated_at.isoformat() if pref.updated_at else None,
        }
    )

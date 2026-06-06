"""
Script Name : config.py
Description : Centralized configuration. Reads DATABASE_URL and other env vars
              once at import time. Used by db_init.py now and the Flask app
              factory (Phase 4) later.
Author      : @tonybnya
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _env(key: str, default: str) -> str:
    """Read an env var; treat empty strings as unset so .env placeholders
    don't shadow the default.
    """
    value = os.getenv(key, default)
    return value if value else default


def _env_optional(key: str) -> str | None:
    value = os.getenv(key)
    return value if value else None


def _resolve_database_uri(raw: str, backend_root: Path) -> str:
    """Convert relative SQLite paths to absolute so the file lands at a
    predictable location (backend/dev.db) instead of Flask's instance/ dir.
    Postgres URLs are returned unchanged.
    """
    if raw.startswith("sqlite:///") and not raw.startswith("sqlite:////"):
        relative = raw.removeprefix("sqlite:///")
        return f"sqlite:///{backend_root / relative}"
    return raw


class Config:
    """All env-driven settings live here."""

    BACKEND_ROOT: Path = Path(__file__).resolve().parent.parent
    SEEDS_DIR: Path = BACKEND_ROOT / "app" / "seeds"

    SQLALCHEMY_DATABASE_URI: str = _resolve_database_uri(
        _env("DATABASE_URL", "sqlite:///dev.db"), BACKEND_ROOT
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict[str, object] = {
        "pool_pre_ping": True,
    }

    GEMINI_API_KEY: str | None = _env_optional("GEMINI_API_KEY")
    CLERK_SECRET_KEY: str | None = _env_optional("CLERK_SECRET_KEY")
    CLERK_PUBLISHABLE_KEY: str | None = _env_optional("VITE_CLERK_PUBLISHABLE_KEY")
    CORS_ORIGINS: str = _env("CORS_ORIGINS", "http://localhost:5173")

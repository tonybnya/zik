"""
Script Name : db_init.py
Description : First-run schema bootstrap. Idempotent: re-running on an existing
              DB is a no-op. Imports the Flask app so SQLAlchemy binds to the
              configured engine, then calls create_all().

              Run with:
                  uv run python -m app.db_init
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Flask

from app.config import Config
from app.extensions import db
from app.models import Favorite, PlayHistory, Preference, Song, User  # noqa: F401


def _build_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app


def init_db() -> list[str]:
    """Create all tables. Returns the list of table names that exist after."""
    app = _build_app()
    with app.app_context():
        db.create_all()
        return sorted(db.Model.metadata.tables.keys())


if __name__ == "__main__":
    tables = init_db()
    print(f"ZIK DB initialized. Tables: {', '.join(tables)}")
    print("Models registered:", "Song, User, PlayHistory, Favorite, Preference")

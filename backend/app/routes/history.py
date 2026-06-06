"""
Script Name : history.py
Description : Play history — append a play event for the authenticated
              user. Used as the signal for Gemini recommendations (Phase 10).
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.auth.middleware import current_user
from app.errors import ApiError
from app.extensions import db
from app.models import PlayHistory, Song
from app.serializers import serialize_history_entry

history_bp = Blueprint("history", __name__, url_prefix="/api/history")


@history_bp.post("")
def log_play():
    """Log that the current user played a song. Returns the new entry."""
    user = current_user()
    payload = request.get_json(silent=True) or {}
    song_id = payload.get("song_id")
    if not isinstance(song_id, int):
        raise ApiError("song_id (int) is required", status_code=400, code="bad_request")

    song = db.session.get(Song, song_id)
    if song is None:
        raise ApiError(f"Song {song_id} not found", status_code=404, code="song_not_found")

    entry = PlayHistory(user_id=user.id, song_id=song_id)
    entry.save(db.session)
    db.session.commit()
    return jsonify(serialize_history_entry(entry)), 201


@history_bp.get("")
def list_history():
    """Return the current user's last 50 plays, newest first."""
    user = current_user()
    rows = db.session.execute(
        select(PlayHistory)
        .where(PlayHistory.user_id == user.id)
        .order_by(PlayHistory.played_at.desc(), PlayHistory.id.desc())
        .limit(50)
    ).scalars().all()
    return jsonify(
        {
            "entries": [serialize_history_entry(h) for h in rows],
            "count": len(rows),
        }
    )

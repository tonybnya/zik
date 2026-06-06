"""
Script Name : favorites.py
Description : User favorites — toggle (POST) and list (GET). Both require
              an authenticated user (stub or Clerk).
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.auth.middleware import current_user
from app.errors import ApiError
from app.extensions import db
from app.models import Favorite, Song
from app.serializers import serialize_song

favorites_bp = Blueprint("favorites", __name__, url_prefix="/api/favorites")


@favorites_bp.post("")
def toggle_favorite():
    """Toggle: if a favorite exists for (user, song), remove it; else add it."""
    user = current_user()
    payload = request.get_json(silent=True) or {}
    song_id = payload.get("song_id")
    if not isinstance(song_id, int):
        raise ApiError("song_id (int) is required", status_code=400, code="bad_request")

    song = db.session.get(Song, song_id)
    if song is None:
        raise ApiError(f"Song {song_id} not found", status_code=404, code="song_not_found")

    existing = db.session.execute(
        select(Favorite).where(
            Favorite.user_id == user.id, Favorite.song_id == song_id
        )
    ).scalar_one_or_none()

    if existing is not None:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"favorited": False, "song_id": song_id})

    fav = Favorite(user_id=user.id, song_id=song_id)
    fav.save(db.session)
    db.session.commit()
    return jsonify({"favorited": True, "song_id": song_id, "favorite_id": fav.id})


@favorites_bp.get("")
def list_favorites():
    """Return all songs the current user has favorited, newest first."""
    user = current_user()
    rows = db.session.execute(
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.saved_at.desc(), Favorite.id.desc())
    ).scalars().all()
    songs = [serialize_song(f.song) for f in rows if f.song is not None]
    return jsonify({"songs": songs, "count": len(songs)})

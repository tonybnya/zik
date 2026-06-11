"""
Script Name : serialiers.py
Description : JSON serializers for SQLAlchemy models. Keeps route code
              small and the response shape consistent.
Author      : @tonybnya
"""

from __future__ import annotations

from typing import Any

from flask import url_for

from app.models import Song


def serialize_song(song: Song) -> dict[str, Any]:
    audio_url: str | None = None
    if song.audio_path:
        audio_url = url_for("songs.serve_song_audio", song_id=song.id, _external=True)
    return {
        "id": song.id,
        "title": song.title,
        "artist": song.artist,
        "genre": song.genre,
        "moods": list(song.moods or []),
        "bpm": song.bpm,
        "external_url": song.external_url,
        "cover_url": song.cover_url,
        "audio_url": audio_url,
    }


def serialize_history_entry(history) -> dict[str, Any]:
    return {
        "id": history.id,
        "song_id": history.song_id,
        "song_title": history.song.title if history.song is not None else None,
        "played_at": history.played_at.isoformat() if history.played_at else None,
        "song": serialize_song(history.song) if history.song else None,
    }


def serialize_favorite(fav) -> dict[str, Any]:
    return {
        "id": fav.id,
        "song_id": fav.song_id,
        "saved_at": fav.saved_at.isoformat() if fav.saved_at else None,
        "song": serialize_song(fav.song) if fav.song else None,
    }

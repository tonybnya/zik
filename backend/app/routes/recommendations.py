"""
Script Name : recommendations.py
Description : Gemini-powered AI recommendations (Phase 10). Pulls the user's
              last 10 plays + preference profile, asks GeminiService for 5
              song suggestions, and cross-references them against the local
              library. Falls back to a deterministic favorites list on
              Gemini failure, missing API key, empty history, or zero DB
              matches.
Author      : @tonybnya
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from flask import Blueprint, current_app, jsonify
from sqlalchemy import select

from app.auth.middleware import current_user
from app.extensions import db
from app.models import Favorite, PlayHistory, Preference, Song
from app.serializers import serialize_song
from app.services.gemini import GeminiError, GeminiService

log = logging.getLogger(__name__)

recommendations_bp = Blueprint(
    "recommendations", __name__, url_prefix="/api/recommendations"
)

HISTORY_LIMIT = 10
RESULT_LIMIT = 5


def _get_service() -> GeminiService:
    """Resolve the GeminiService — prefer the test-injected one, fall back to
    a default client built from the env.
    """
    service: GeminiService | None = current_app.extensions.get("gemini_service")
    if service is None:
        service = GeminiService()
    return service


def _load_history(user_id: int) -> list[dict[str, Any]]:
    rows = (
        db.session.execute(
            select(PlayHistory)
            .where(PlayHistory.user_id == user_id)
            .order_by(PlayHistory.played_at.desc(), PlayHistory.id.desc())
            .limit(HISTORY_LIMIT)
        )
        .scalars()
        .all()
    )
    out: list[dict[str, Any]] = []
    for row in rows:
        if row.song is None:
            continue
        out.append(
            {
                "title": row.song.title,
                "artist": row.song.artist,
                "genre": row.song.genre,
                "moods": list(row.song.moods or []),
            }
        )
    # GeminiService expects oldest → newest.
    out.reverse()
    return out


def _load_preferences(user_id: int) -> tuple[list[str], list[str]]:
    pref = db.session.execute(
        select(Preference).where(Preference.user_id == user_id)
    ).scalar_one_or_none()
    if pref is None:
        return [], []
    return list(pref.preferred_genres or []), list(pref.preferred_moods or [])


def _cross_reference(suggestions) -> list[Song]:
    """Look up each suggestion in the local library by (title, artist). Songs
    not in the library are silently dropped.
    """
    if not suggestions:
        return []
    pairs = {(s.title.lower(), s.artist.lower()): s for s in suggestions}
    rows = (
        db.session.execute(
            select(Song).where(
                db.or_(
                    *[
                        db.and_(
                            db.func.lower(Song.title) == t,
                            db.func.lower(Song.artist) == a,
                        )
                        for (t, a) in pairs.keys()
                    ]
                )
            )
        )
        .scalars()
        .all()
    )
    matched: list[Song] = []
    for song in rows:
        key = (song.title.lower(), song.artist.lower())
        if key in pairs:
            matched.append(song)
    return matched


def _favorites_fallback(user_id: int) -> list[Song]:
    rows = (
        db.session.execute(
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.saved_at.desc(), Favorite.id.desc())
            .limit(RESULT_LIMIT)
        )
        .scalars()
        .all()
    )
    return [f.song for f in rows if f.song is not None]


@recommendations_bp.get("")
def get_recommendations():
    """Return up to 5 AI-suggested songs (Phase 10).

    Flow:
      1. Load last 10 plays + the user's preference profile.
      2. Ask GeminiService for 5 suggestions matching that signal.
      3. Cross-reference each suggestion against the local song library.
      4. Return matched songs. If Gemini errors or nothing matched, fall back
         to the user's 5 most recently favorited tracks.
    """
    user = current_user()

    history = _load_history(user.id)
    if not history:
        songs = _favorites_fallback(user.id)
        return jsonify(
            {
                "songs": [serialize_song(s) for s in songs],
                "ai_powered": False,
                "source": "favorites_fallback",
            }
        )

    preferred_genres, preferred_moods = _load_preferences(user.id)
    service = _get_service()

    try:
        suggestions = asyncio.run(
            service.recommend(
                preferred_genres=preferred_genres,
                preferred_moods=preferred_moods,
                history=history,
            )
        )
    except GeminiError as exc:
        log.info("Gemini unavailable, using favorites fallback: %s", exc)
        suggestions = []

    matched = _cross_reference(suggestions)
    if not matched:
        songs = _favorites_fallback(user.id)
        return jsonify(
            {
                "songs": [serialize_song(s) for s in songs],
                "ai_powered": False,
                "source": "favorites_fallback",
            }
        )

    return jsonify(
        {
            "songs": [serialize_song(s) for s in matched[:RESULT_LIMIT]],
            "ai_powered": True,
            "source": "gemini",
        }
    )

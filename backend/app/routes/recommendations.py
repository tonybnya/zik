"""
Script Name : recommendations.py
Description : Gemini-powered AI recommendations. Stubbed in Phase 4 —
              real Gemini integration lands in Phase 10. The stub returns
              the user's top 5 favorited songs as a placeholder so the
              frontend can render the bubble flow end-to-end while the
              real model is built.
Author      : @tonybnya
"""

from __future__ import annotations

from flask import Blueprint, jsonify
from sqlalchemy import select

from app.auth.middleware import current_user
from app.extensions import db
from app.models import Favorite
from app.serializers import serialize_song

recommendations_bp = Blueprint(
    "recommendations", __name__, url_prefix="/api/recommendations"
)


@recommendations_bp.get("")
def get_recommendations():
    """Return up to 5 AI-suggested songs.

    Phase 4 stub: returns the user's most-recently-favorited songs.
    Phase 10 will swap the body for a real GeminiService call.
    """
    user = current_user()
    rows = db.session.execute(
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.saved_at.desc())
        .limit(5)
    ).scalars().all()
    songs = [serialize_song(f.song) for f in rows if f.song is not None]

    return jsonify(
        {
            "songs": songs,
            "ai_powered": False,  # flipped to True in Phase 10
            "source": "favorites_fallback",
        }
    )

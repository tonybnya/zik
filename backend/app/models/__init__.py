"""
Script Name : __init__.py
Description : Re-exports all models so `from app.models import Song, User` works.
              Importing this package has the side effect of registering every
              model with db.Model.metadata, which is what db.create_all() uses.
Author      : @tonybnya
"""

from app.models.base import Base, TimestampMixin
from app.models.favorite import Favorite
from app.models.play_history import PlayHistory
from app.models.preference import Preference
from app.models.song import Song
from app.models.user import User

__all__ = [
    "Base",
    "TimestampMixin",
    "Song",
    "User",
    "PlayHistory",
    "Favorite",
    "Preference",
]

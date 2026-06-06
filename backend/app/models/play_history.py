"""
Script Name : play_history.py
Description : PlayHistory model — append-only log of songs a user has played.
              Used for the AI recommendation engine (Phase 10).
Author      : @tonybnya
"""

from __future__ import annotations

from datetime import datetime

from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.song import Song
    from app.models.user import User


class PlayHistory(Base, db.Model):  # ty:ignore[unsupported-base]
    __tablename__ = "play_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    song_id: Mapped[int] = mapped_column(
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    played_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )

    user: Mapped[User] = relationship(back_populates="history")
    song: Mapped[Song] = relationship(back_populates="history")

    def __repr__(self) -> str:
        return f"<PlayHistory user={self.user_id} song={self.song_id} at {self.played_at}>"

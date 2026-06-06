"""
Script Name : favorite.py
Description : Favorite model — a user-saved song. Composite unique constraint
              prevents duplicate favorites; cascade delete cleans up when
              the user or song is removed.
Author      : @tonybnya
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.song import Song
    from app.models.user import User


class Favorite(Base, db.Model):  # ty:ignore[unsupported-base]
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "song_id", name="uq_favorite_user_song"),
    )

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
    saved_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="favorites")
    song: Mapped[Song] = relationship(back_populates="favorites")

    def __repr__(self) -> str:
        return f"<Favorite user={self.user_id} song={self.song_id}>"

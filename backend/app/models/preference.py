"""
Script Name : preference.py
Description : Preference model — one-to-one with User. Stores the user's
              preferred genres and moods, used by both the similar-songs
              query (Phase 4) and the Gemini prompt (Phase 10).
Author      : @tonybnya
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Preference(Base, TimestampMixin, db.Model):  # ty:ignore[unsupported-base]
    __tablename__ = "preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    preferred_genres: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    preferred_moods: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )

    user: Mapped[User] = relationship(back_populates="preference")

    def __repr__(self) -> str:
        return f"<Preference user={self.user_id} genres={self.preferred_genres} moods={self.preferred_moods}>"

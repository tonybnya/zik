"""
Script Name : user.py
Description : User model. Auth identity is a Clerk user id (clerk_id). The same
              table is used for both Clerk-managed and stub-dev users.
Author      : @tonybnya
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.favorite import Favorite
    from app.models.play_history import PlayHistory
    from app.models.preference import Preference


class User(Base, TimestampMixin, db.Model):  # ty:ignore[unsupported-base]
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    clerk_id: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )

    favorites: Mapped[list[Favorite]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    history: Mapped[list[PlayHistory]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    preference: Mapped[Preference | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )

    def __repr__(self) -> str:
        return f"<User {self.id} clerk={self.clerk_id!r} email={self.email!r}>"

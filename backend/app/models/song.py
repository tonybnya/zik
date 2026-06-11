"""
Script Name : song.py
Description : Song model — the core library entry. Public-domain / royalty-free
              focus music. audio_path points to the local audio file; external_url
              is preserved as a fallback source reference.
Author      : @tonybnya
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.favorite import Favorite
    from app.models.play_history import PlayHistory


class Song(Base, TimestampMixin, db.Model):  # ty:ignore[unsupported-base]
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    artist: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    genre: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    moods: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    bpm: Mapped[int | None] = mapped_column(nullable=True)
    external_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    audio_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    favorites: Mapped[list[Favorite]] = relationship(
        back_populates="song", cascade="all, delete-orphan"
    )
    history: Mapped[list[PlayHistory]] = relationship(
        back_populates="song", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Song {self.id} {self.title!r} by {self.artist!r}>"

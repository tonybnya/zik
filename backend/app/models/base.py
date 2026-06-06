"""
Script Name : base.py
Description : Shared model primitives. `Base` is a plain Python mixin that
              provides the save() helper. Concrete models inherit from BOTH
              this mixin and db.Model so SQLAlchemy handles persistence and
              we keep type-checker-friendly inheritance.
Author      : @tonybnya
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Mapped, Session, mapped_column


class TimestampMixin:
    """Adds created_at and updated_at columns with DB-side defaults."""

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )


class Base:
    """Pure-Python base providing the save() helper. Concrete models inherit
    from this alongside db.Model, e.g.:

        class Song(Base, TimestampMixin, db.Model):
            __tablename__ = "songs"
            ...

    This avoids dynamic-class MRO issues that trip up static type checkers
    when inheriting from db.Model directly.
    """

    def save(self, session: Session) -> None:
        """Add this instance to the session and flush so primary keys are
        populated. Caller commits when the unit of work is complete.
        """
        session.add(self)
        session.flush()

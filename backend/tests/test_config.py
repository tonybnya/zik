"""Tests for the configuration loader."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.config import _env, _resolve_database_uri


def test_resolve_relative_sqlite_to_absolute(tmp_path: Path) -> None:
    result = _resolve_database_uri("sqlite:///dev.db", tmp_path)
    assert result == f"sqlite:///{tmp_path / 'dev.db'}"


def test_resolve_passes_through_postgres() -> None:
    pg = "postgresql+psycopg://user:pass@host:5432/db"
    assert _resolve_database_uri(pg, Path("/anywhere")) == pg


def test_resolve_preserves_absolute_sqlite() -> None:
    raw = "sqlite:////var/data/zik.db"  # 4 slashes = absolute path
    assert _resolve_database_uri(raw, Path("/anywhere")) == raw


def test_env_treats_empty_as_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ZIK_TEST_KEY", "")
    assert _env("ZIK_TEST_KEY", "fallback") == "fallback"


def test_env_uses_real_value(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ZIK_TEST_KEY", "real")
    assert _env("ZIK_TEST_KEY", "fallback") == "real"


def test_env_uses_default_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ZIK_TEST_KEY", raising=False)
    assert _env("ZIK_TEST_KEY", "fallback") == "fallback"

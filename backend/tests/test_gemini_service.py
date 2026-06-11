"""
Script Name : test_gemini_service.py
Description : Unit tests for GeminiService. The Gemini client is injected via
              the constructor so we never hit the network — the mock just
              records the call and returns a canned response.

Author      : @tonybnya
"""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any

import pytest

from app.services.gemini import (
    GeminiError,
    GeminiService,
    Suggestion,
    build_prompt,
    parse_suggestions,
)


class FakeModels:
    """Mock for the `client.aio.models` namespace."""

    def __init__(self) -> None:
        self.last_call: dict[str, Any] | None = None
        self.next_response: Any = None
        self.next_error: BaseException | None = None

    async def generate_content(self, *, model: str, contents: str) -> Any:
        self.last_call = {"model": model, "contents": contents}
        if self.next_error is not None:
            raise self.next_error
        return self.next_response


class FakeAio:
    def __init__(self) -> None:
        self.models = FakeModels()


class FakeClient:
    def __init__(self) -> None:
        self.aio = FakeAio()


def _service() -> tuple[GeminiService, FakeClient]:
    client = FakeClient()
    return GeminiService(client=client), client  # ty:ignore[invalid-argument-type]


# --- Pure-function helpers ---------------------------------------------------


def test_build_prompt_includes_genres_and_moods() -> None:
    prompt = build_prompt(
        preferred_genres=["lofi", "ambient"],
        preferred_moods=["focus", "calm"],
        history=[],
    )
    assert "lofi" in prompt and "ambient" in prompt
    assert "focus" in prompt and "calm" in prompt
    assert "JSON" in prompt


def test_build_prompt_lists_recent_plays_newest_first() -> None:
    prompt = build_prompt(
        preferred_genres=[],
        preferred_moods=[],
        history=[
            {"title": "Oldest", "artist": "A", "genre": "lofi", "moods": ["calm"]},
            {"title": "Newest", "artist": "B", "genre": "jazz", "moods": ["focus"]},
        ],
    )
    # Newest should appear before Oldest in the rendered list.
    assert prompt.index("Newest") < prompt.index("Oldest")


def test_build_prompt_handles_empty_history() -> None:
    prompt = build_prompt(preferred_genres=["lofi"], preferred_moods=[], history=[])
    assert "No recent plays" in prompt or "none" in prompt.lower()


def test_parse_suggestions_accepts_pure_json() -> None:
    raw = json.dumps(
        [
            {
                "title": "Rainy Window",
                "artist": "Tape Deck",
                "genre": "lofi",
                "moods": ["calm", "focus"],
            },
            {
                "title": "Quiet Library",
                "artist": "Chillhop",
                "genre": "lofi",
                "moods": ["focus"],
            },
        ]
    )
    out = parse_suggestions(raw)
    assert len(out) == 2
    assert out[0] == Suggestion(
        title="Rainy Window",
        artist="Tape Deck",
        genre="lofi",
        moods=["calm", "focus"],
    )


def test_parse_suggestions_strips_code_fences() -> None:
    raw = (
        "```json\n"
        + json.dumps(
            [{"title": "A", "artist": "B", "genre": "lofi", "moods": ["calm"]}]
        )
        + "\n```"
    )
    out = parse_suggestions(raw)
    assert len(out) == 1
    assert out[0].title == "A"


def test_parse_suggestions_raises_on_garbage() -> None:
    with pytest.raises(GeminiError):
        parse_suggestions("totally not json")


def test_parse_suggestions_raises_on_missing_fields() -> None:
    raw = json.dumps([{"title": "Only title"}])
    with pytest.raises(GeminiError):
        parse_suggestions(raw)


def test_parse_suggestions_caps_at_five() -> None:
    raw = json.dumps(
        [
            {"title": f"T{i}", "artist": "A", "genre": "lofi", "moods": ["calm"]}
            for i in range(10)
        ]
    )
    out = parse_suggestions(raw)
    assert len(out) == 5


# --- Service.recommend --------------------------------------------------------


async def test_recommend_returns_parsed_suggestions() -> None:
    service, client = _service()
    client.aio.models.next_response = SimpleNamespace(
        text=json.dumps(
            [
                {
                    "title": "Rainy",
                    "artist": "Tape",
                    "genre": "lofi",
                    "moods": ["calm"],
                },
                {
                    "title": "Quiet",
                    "artist": "Chill",
                    "genre": "lofi",
                    "moods": ["focus"],
                },
            ]
        )
    )

    out = await service.recommend(
        preferred_genres=["lofi"],
        preferred_moods=["calm"],
        history=[],
    )
    assert len(out) == 2
    assert out[0].title == "Rainy"


async def test_recommend_uses_flash_model() -> None:
    service, client = _service()
    client.aio.models.next_response = SimpleNamespace(
        text=json.dumps(
            [{"title": "A", "artist": "B", "genre": "lofi", "moods": ["calm"]}]
        )
    )
    await service.recommend(preferred_genres=[], preferred_moods=[], history=[])
    assert client.aio.models.last_call is not None
    assert "flash" in client.aio.models.last_call["model"].lower()


async def test_recommend_wraps_client_errors() -> None:
    service, client = _service()
    client.aio.models.next_error = RuntimeError("network down")

    with pytest.raises(GeminiError):
        await service.recommend(preferred_genres=[], preferred_moods=[], history=[])


async def test_recommend_wraps_empty_response() -> None:
    service, client = _service()
    client.aio.models.next_response = SimpleNamespace(text=None)

    with pytest.raises(GeminiError):
        await service.recommend(preferred_genres=[], preferred_moods=[], history=[])

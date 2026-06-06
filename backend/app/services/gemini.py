"""
Script Name : gemini.py
Description : GeminiService — wraps the `google-genai` async client to suggest
              5 focus tracks from a user's recent play history + preferences.
              The route layer is responsible for cross-referencing suggestions
              against the local seed library and falling back when Gemini is
              unavailable or the response is unparseable.

Author      : @tonybnya
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass

from google import genai

log = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-2.5-flash"
ALLOWED_GENRES = {
    "lofi", "ambient", "classical", "jazz", "nature", "cinematic", "synthwave",
}
MAX_SUGGESTIONS = 5


class GeminiError(RuntimeError):
    """Raised when the Gemini call or its response can't be used. The route
    layer catches this to fall back to a deterministic source.
    """


@dataclass(frozen=True)
class Suggestion:
    """A single song suggestion straight from Gemini. The route layer maps
    these to real DB rows by (title, artist) when possible.
    """
    title: str
    artist: str
    genre: str
    moods: list[str]


def build_prompt(
    *,
    preferred_genres: list[str],
    preferred_moods: list[str],
    history: list[dict],
) -> str:
    """Render the user-facing prompt. Pure function — unit-tested in isolation.

    `history` is expected oldest → newest. The rendered list is reversed so the
    model sees the most recent play first.
    """
    genres = ", ".join(preferred_genres) if preferred_genres else "no preference"
    moods = ", ".join(preferred_moods) if preferred_moods else "no preference"

    if history:
        recent_lines: list[str] = []
        for i, h in enumerate(reversed(history[:10]), start=1):
            recent_lines.append(
                f'{i}. "{h["title"]}" by {h["artist"]} '
                f'(genre: {h["genre"]}, moods: {", ".join(h.get("moods", []))})'
            )
        recent = "\n".join(recent_lines)
    else:
        recent = "No recent plays yet."

    allowed = ", ".join(sorted(ALLOWED_GENRES))
    return (
        "You are a focus-music curator for ZIK, a royalty-free focus-music app. "
        "Suggest 5 NEW songs (not in the user's history) for a deep-work session.\n\n"
        f"User preferences:\n"
        f"- Preferred genres: {genres}\n"
        f"- Preferred moods: {moods}\n\n"
        f"Recent plays (most recent first):\n{recent}\n\n"
        "Return ONLY a JSON array of exactly 5 objects, no commentary, no code fences. "
        "Each object MUST have:\n"
        '- "title" (string)\n'
        '- "artist" (string)\n'
        f'- "genre" (one of: {allowed})\n'
        '- "moods" (array of 1-3 short strings, e.g. ["focus", "calm"])\n\n'
        "Example:\n"
        '[{"title":"Midnight Coffee","artist":"Chillhop Music",'
        '"genre":"lofi","moods":["focus","calm"]}]'
    )


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def parse_suggestions(raw: str) -> list[Suggestion]:
    """Parse a JSON array of 5 song objects from Gemini's text response.

    Tolerates ```json fences and surrounding whitespace. Raises GeminiError on
    any structural problem; the caller falls back in that case.
    """
    if not raw or not raw.strip():
        raise GeminiError("Gemini returned an empty response")
    cleaned = _FENCE_RE.sub("", raw).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GeminiError(f"Gemini response was not valid JSON: {exc}") from exc
    if not isinstance(data, list):
        raise GeminiError("Gemini response was not a JSON array")

    out: list[Suggestion] = []
    for item in data[:MAX_SUGGESTIONS]:
        if not isinstance(item, dict):
            continue
        try:
            title = str(item["title"]).strip()
            artist = str(item["artist"]).strip()
            genre = str(item["genre"]).strip().lower()
            moods_raw = item.get("moods", [])
        except KeyError as exc:
            raise GeminiError(f"Missing field in suggestion: {exc}") from exc
        if not title or not artist or genre not in ALLOWED_GENRES:
            continue
        if not isinstance(moods_raw, list):
            continue
        moods = [str(m).strip().lower() for m in moods_raw if str(m).strip()]
        if not moods:
            continue
        out.append(
            Suggestion(title=title, artist=artist, genre=genre, moods=moods)
        )
    if not out:
        raise GeminiError("Gemini response had no usable suggestions")
    return out


def _build_default_client() -> genai.Client:
    """Construct a real Gemini client from the env. Used when the service is
    constructed without an injected client (i.e. in production).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiError("GEMINI_API_KEY is not set")
    return genai.Client(api_key=api_key)


class GeminiService:
    """Thin wrapper over `google-genai`'s async surface. Construct one per
    request (or per app) and inject a mock client in tests.
    """

    def __init__(
        self,
        client: genai.Client | None = None,
        *,
        model: str = DEFAULT_MODEL,
    ) -> None:
        self._explicit_client = client
        self._model = model

    def _get_client(self) -> genai.Client:
        return self._explicit_client or _build_default_client()

    async def recommend(
        self,
        *,
        preferred_genres: list[str],
        preferred_moods: list[str],
        history: list[dict],
    ) -> list[Suggestion]:
        """Ask Gemini for 5 focus-track suggestions. Raises GeminiError on
        any failure the caller should treat as 'use the fallback'.
        """
        prompt = build_prompt(
            preferred_genres=preferred_genres,
            preferred_moods=preferred_moods,
            history=history,
        )
        try:
            client = self._get_client()
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
            )
        except Exception as exc:  # noqa: BLE001 — we want to swallow all client errors
            log.warning("Gemini call failed: %s", exc)
            raise GeminiError(str(exc)) from exc

        text = getattr(response, "text", None)
        if not text:
            raise GeminiError("Gemini response had no text")
        return parse_suggestions(text)

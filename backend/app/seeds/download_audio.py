"""
Script Name : download_audio.py
Description : Downloads royalty-free MP3s from Internet Archive for each
              genre in the ZIK song library. Saves files to app/audio/{genre}/.
              Run with:  uv run python -m app.seeds.download_audio
Author      : @tonybnya
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

from app.config import Config

# ---------------------------------------------------------------------------
# IA item identifiers we know have MP3 files for each genre.
# Each entry: (identifier, max_files_to_take)
# ---------------------------------------------------------------------------
IA_ITEMS: dict[str, list[tuple[str, int]]] = {
    "lofi": [
        ("LofiBeatsRadioEpisodeTen2619", 5),
        ("3x13_-_a_summer_spent_inside", 5),
        ("lofi-lion-tame-the-beast", 3),
    ],
    "ambient": [
        ("OnwardUpward-13786", 5),
        ("OceanSound-NatureSounds", 3),
    ],
    "jazz": [
        ("spotifycoversynthwave", 2),
        ("dmrc-david-golightly", 5),
        ("MoiteurDuneChaudeNuitDete-Nov2008", 3),
    ],
    "classical": [
        ("100ClassicalMusicMasterpieces", 8),
        ("MusopenCollectionAsFlac", 8),
    ],
    "cinematic": [
        ("100ClassicalMusicMasterpieces", 4),
        ("OnwardUpward-13786", 3),
        ("MoiteurDuneChaudeNuitDete-Nov2008", 3),
    ],
    "nature": [
        ("OceanSound-NatureSounds", 5),
        ("ocean-sea-sounds", 5),
        ("relaxingrainsounds", 3),
    ],
    "synthwave": [
        ("spotifycoversynthwave", 3),
        ("home-before-the-night", 3),
        ("darkwave", 2),
    ],
}

MAX_PER_ITEM = 8


def get_files(identifier: str) -> list[dict]:
    """Get the file list for an IA item via the metadata API."""
    url = f"https://archive.org/metadata/{identifier}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ZIK/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        print(f"  [!] Failed to fetch {identifier}: {exc}")
        return []
    return data.get("files", [])


def download_file(url: str, dest: Path) -> bool:
    """Download a single file. Returns True on success."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 10_000:
        return True  # already downloaded
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ZIK/1.0"})
        with urllib.request.urlopen(req, timeout=30) as src:
            data = src.read()
        if len(data) < 10_000:
            print(f"  [!] {dest.name} too small ({len(data)} bytes), skipping")
            return False
        dest.write_bytes(data)
        print(f"  [OK] {dest.name} ({len(data) / 1024 / 1024:.1f} MB)")
        return True
    except Exception as exc:
        print(f"  [!] Failed to download {dest.name}: {exc}")
        return False


def download_genre(genre: str) -> int:
    """Download up to MAX_PER_ITEM MP3s for one genre. Returns count."""
    audio_dir = Config.AUDIO_DIR / genre
    audio_dir.mkdir(parents=True, exist_ok=True)

    items = IA_ITEMS.get(genre, [])
    if not items:
        print(f"  No items configured for {genre}, skipping")
        return 0

    count = 0
    downloaded: set[str] = set()

    for identifier, take in items:
        if count >= MAX_PER_ITEM:
            break
        files = get_files(identifier)
        mp3_files = [
            f
            for f in files
            if f.get("name", "").endswith(".mp3") and f.get("size", "0").isdigit()
        ]
        mp3_files.sort(key=lambda f: -int(f.get("size", "0")))

        for f in mp3_files:
            if count >= min(take, MAX_PER_ITEM):
                break
            name = f["name"]
            if name in downloaded:
                continue
            download_url = f"https://archive.org/download/{identifier}/{name}"
            dest = audio_dir / name
            if download_file(download_url, dest):
                downloaded.add(name)
                count += 1

    return count


def main() -> int:
    print("Downloading royalty-free audio from Internet Archive...\n")
    total = 0
    for genre in sorted(IA_ITEMS.keys()):
        print(f"[{genre}]")
        n = download_genre(genre)
        total += n
        print(f"  -> {n} files\n")
    print(f"Total: {total} audio files in {Config.AUDIO_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

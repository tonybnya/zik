"""
Script Name : generate_audio.py
Description : Generates simple royalty-free audio WAV files for each genre.
              Creates unique tone patterns per track using additive synthesis.
              Run with:  uv run python -m app.seeds.generate_audio
Author      : @tonybnya
"""

from __future__ import annotations

import math
import random
import struct
from collections.abc import Callable
from pathlib import Path
from wave import Wave_write

from app.config import Config

SAMPLE_RATE = 44100
DURATION = 15  # seconds per track
AMPLITUDE = 0.3
TRACKS_PER_GENRE = 5


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with Wave_write(str(path)) as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        data = bytearray()
        for s in samples:
            s = max(-1.0, min(1.0, s))
            data.extend(struct.pack("<h", int(s * 32767)))
        w.writeframes(bytes(data))


def sine(freq: float, t: float) -> float:
    return math.sin(2.0 * math.pi * freq * t)


def noise(amount: float = 1.0) -> float:
    return (random.random() * 2.0 - 1.0) * amount


def adsr(
    t: float, attack: float, decay: float, sustain: float, release: float, dur: float
) -> float:
    if t < attack:
        return t / attack
    elif t < attack + decay:
        return 1.0 - (1.0 - sustain) * (t - attack) / decay
    elif t < dur - release:
        return sustain
    else:
        rt = t - (dur - release)
        return sustain * (1.0 - rt / release)


# ---------------------------------------------------------------------------
# Genre generators — each returns samples for one track
# ---------------------------------------------------------------------------


def gen_lofi(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    # Slow chord: minor 7th
    base = 130 + seed * 3
    freqs = [base, base * 1.25, base * 1.5, base * 1.75]
    for i in range(n):
        t = i / sr
        env = adsr(t, 0.05, 0.1, 0.4, 0.5, dur)
        s = sum(sine(f, t) for f in freqs) / len(freqs) * env * 0.4
        # Soft vinyl crackle
        s += noise(0.015)
        samples[i] = s * AMPLITUDE
    # Tape wobble
    for i in range(1, n):
        samples[i] += 0.98 * samples[i - 1] * (1.0 + noise(0.001))
    return samples


def gen_ambient(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    base = 100 + seed * 5
    freqs = [base * 0.5, base, base * 1.5, base * 2.01]
    for i in range(n):
        t = i / sr
        env = adsr(t, 1.0, 1.0, 0.6, 2.0, dur)
        s = (
            sum(sine(f, t + noise(0.002) * t / 20) for f in freqs)
            / len(freqs)
            * env
            * 0.35
        )
        s += noise(0.01) * env
        samples[i] = s * AMPLITUDE
    return samples


def gen_jazz(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    bpm = 100
    beat_len = 60.0 / bpm
    base = 200 + seed * 2
    chords = [base, base * 1.33, base * 1.5, base * 1.8]
    for i in range(n):
        t = i / sr
        bar_pos = (t % (beat_len * 4)) / beat_len
        env = adsr(t, 0.02, 0.05, 0.5, 0.3, dur)
        s = 0.0
        for f in chords:
            s += sine(f * (1.0 + 0.5 * math.sin(t * 2.0)), t) / len(chords)
        s *= env * 0.3
        # Walking bass on beat
        if abs(bar_pos - int(bar_pos)) < 0.05:
            s += sine(base * 0.5, t) * 0.15
        samples[i] = s * AMPLITUDE
    return samples


def gen_classical(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    # Simple melody
    base = 261 + seed * 2  # C4-ish
    melody = [
        base,
        base * 1.25,
        base * 1.5,
        base * 1.33,
        base * 1.25,
        base * 0.75,
        base * 1.0,
        base * 1.25,
    ]
    note_len = dur / len(melody)
    for i in range(n):
        t = i / sr
        note_idx = min(int(t / note_len), len(melody) - 1)
        freq = melody[note_idx]
        local_t = t - note_idx * note_len
        env = adsr(local_t, 0.05, 0.2, 0.5, 0.4, note_len)
        s = sine(freq, t) * env * 0.3
        s += sine(freq * 2.0, t) * env * 0.1  # Harmonic
        s += sine(freq * 0.5, t) * env * 0.1  # Bass
        samples[i] = s * AMPLITUDE
    return samples


def gen_cinematic(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    base = 80 + seed * 3
    freqs = [base * 0.5, base, base * 1.5, base * 2.0, base * 3.0]
    for i in range(n):
        t = i / sr
        env = adsr(t, 2.0, 1.0, 0.7, 3.0, dur)
        s = (
            sum(sine(f, t * 0.8 + noise(0.001) * t / 10) for f in freqs)
            / len(freqs)
            * env
            * 0.4
        )
        samples[i] = s * AMPLITUDE
    return samples


def gen_nature(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    for i in range(n):
        t = i / sr
        # Brown noise
        env = adsr(t, 0.5, 0.5, 0.8, 1.0, dur)
        s = noise(0.3) * env
        # Wind (filtered noise approximation)
        wind_freq = 200 + 100 * math.sin(t * 0.3 + seed)
        s += sine(wind_freq, t + noise(0.1) * 10) * 0.08 * env
        samples[i] = s * AMPLITUDE
    return samples


def gen_synthwave(seed: int) -> list[float]:
    random.seed(seed)
    sr = SAMPLE_RATE
    dur = DURATION
    n = sr * dur
    samples = [0.0] * n
    bpm = 120
    beat_len = 60.0 / bpm
    base = 150 + seed * 4
    freqs = [base, base * 1.5, base * 2.0]
    for i in range(n):
        t = i / sr
        bar_pos = (t % (beat_len * 4)) / beat_len
        env = adsr(t, 0.1, 0.2, 0.6, 1.0, dur)
        s = (
            sum(sine(f * (1.0 + 0.3 * math.sin(t * 3.0)), t) for f in freqs)
            / len(freqs)
            * env
            * 0.3
        )
        # Arp
        if abs(bar_pos - int(bar_pos)) < 0.15:
            arp_freq = base * (1.0 + 0.5 * (int(bar_pos) % 4) / 3)
            s += sine(arp_freq, t) * 0.15 * env
        samples[i] = s * AMPLITUDE
    return samples


GENERATORS: dict[str, Callable[[int], list[float]]] = {
    "lofi": gen_lofi,
    "ambient": gen_ambient,
    "jazz": gen_jazz,
    "classical": gen_classical,
    "cinematic": gen_cinematic,
    "nature": gen_nature,
    "synthwave": gen_synthwave,
}


def main() -> int:
    print("Generating royalty-free audio files...\n")
    total = 0
    for genre, gen_fn in sorted(GENERATORS.items()):
        genre_dir = Config.AUDIO_DIR / genre
        genre_dir.mkdir(parents=True, exist_ok=True)
        for track_idx in range(TRACKS_PER_GENRE):
            seed = hash(f"{genre}-{track_idx}") % 10000
            name = f"{genre}_{track_idx + 1}.wav"
            dest = genre_dir / name
            if dest.exists() and dest.stat().st_size > 10000:
                print(f"  [SKIP] {genre}/{name} (exists)")
                total += 1
                continue
            print(f"  [GEN]  {genre}/{name} (seed={seed})...", end=" ", flush=True)
            samples = gen_fn(seed)
            write_wav(dest, samples)
            print(f"OK ({dest.stat().st_size / 1024:.0f} KB)")
            total += 1
    print(f"\nGenerated {total} files in {Config.AUDIO_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

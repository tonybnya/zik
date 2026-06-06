import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiMagicIcon } from "@hugeicons/core-free-icons";

import type { Song } from "../../types/song";
import type { BubbleOffset } from "./layout";

interface SongBubbleProps {
  song: Song;
  /** Orbit offset from the cassette center, in vmin. */
  offset: BubbleOffset;
  onSelect: (song: Song) => void;
  reduced: boolean;
}

/**
 * A single floating song bubble (Tasks 7.1, 7.2, 7.4, 7.5, 7.6).
 *
 * Scales in from the cassette center and flies to its orbit position; on exit
 * it collapses back toward center (AnimatePresence drives the exit). Hover adds
 * a glow ring + pulse. Clicking selects the song. AI picks get an accent ring
 * and a magic badge.
 */
export function SongBubble({ song, offset, onSelect, reduced }: SongBubbleProps) {
  const mood = song.moods[0];
  const at = { x: `${offset.dx}vmin`, y: `${offset.dy}vmin` };

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(song)}
      aria-label={`Play ${song.title} by ${song.artist}`}
      className={`pointer-events-auto [grid-area:1/1] flex w-[clamp(8rem,22vmin,12rem)] flex-col gap-1.5 rounded-lg border p-3 text-left backdrop-blur-sm transition-shadow ${
        song.isAiPick
          ? "border-line-warm bg-card/90 shadow-[var(--shadow-glow)]"
          : "border-line/30 bg-card/85 shadow-[var(--shadow-card)]"
      }`}
      initial={reduced ? { opacity: 0, scale: 0.9, ...at } : { opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1, ...at }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0, x: 0, y: 0 }}
      transition={
        reduced
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 120, damping: 16, mass: 0.6 }
      }
      whileHover={{ scale: 1.06, boxShadow: "var(--shadow-glow), var(--shadow-elevated)" }}
      whileTap={{ scale: 0.96 }}
    >
      {song.isAiPick && (
        <span className="chip chip-accent self-start gap-1 text-[0.55rem]">
          <HugeiconsIcon icon={AiMagicIcon} size={11} strokeWidth={2} />
          AI pick
        </span>
      )}
      <span className="truncate text-ink text-[0.8rem] font-medium tracking-tight normal-case">
        {song.title}
      </span>
      <span className="label-caps truncate text-ink-soft text-[0.55rem]">
        {song.artist}
      </span>
      <span className="mt-0.5 flex flex-wrap gap-1">
        <span className="chip text-[0.5rem]">{song.genre}</span>
        {mood && <span className="chip text-[0.5rem]">{mood}</span>}
      </span>
    </motion.button>
  );
}

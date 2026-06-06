import { AnimatePresence } from "motion/react";
import { useReducedMotion } from "motion/react";

import type { Song } from "../../types/song";
import { SongBubble } from "./SongBubble";
import { computeOffset } from "./layout";

interface BubbleFieldProps {
  /** Similar / AI-suggested songs to orbit around the cassette. */
  songs: Song[];
  onSelect: (song: Song) => void;
  /** Cap on simultaneously visible bubbles (Task 7.7). */
  maxVisible?: number;
  className?: string;
}

/**
 * Lays out song bubbles in orbit around the cassette center (Task 7.3) and
 * manages spawn/exit transitions via AnimatePresence (Task 7.8). When more than
 * `maxVisible` songs arrive, only the first N render; as the set changes,
 * removed bubbles animate out and new ones fly in (Task 7.7).
 *
 * Render this as a sibling overlay covering the cassette area (absolute
 * inset-0). It ignores pointer events except on the bubbles themselves.
 */
export function BubbleField({
  songs,
  onSelect,
  maxVisible = 8,
  className,
}: BubbleFieldProps) {
  const reduced = useReducedMotion() ?? false;
  const visible = songs.slice(0, maxVisible);

  return (
    <div
      className={`pointer-events-none absolute inset-0 grid place-items-center ${className ?? ""}`}
      aria-label="Similar songs"
    >
      <AnimatePresence>
        {visible.map((song, i) => (
          <SongBubble
            key={song.id}
            song={song}
            offset={computeOffset(song.id, i, visible.length)}
            onSelect={onSelect}
            reduced={reduced}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

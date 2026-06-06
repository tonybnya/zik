import type { CassetteSong } from "./types";

interface CassetteLabelProps {
  song?: CassetteSong | null;
}

/**
 * The handwritten-style label on the cassette plate (Task 6.5). Shows the
 * current track, or a prompt before the first play. Positioned as an overlay
 * over the SVG label plate using percentages so it tracks the cassette's size.
 */
export function CassetteLabel({ song }: CassetteLabelProps) {
  return (
    <div className="pointer-events-none absolute left-[14%] right-[14%] top-[5%] h-[22%] flex flex-col items-center justify-center text-center">
      {song ? (
        <>
          <p className="w-full truncate text-ink text-[clamp(0.7rem,2.6vw,1rem)] font-medium tracking-tight">
            {song.title}
          </p>
          <p className="label-caps w-full truncate text-ink-soft text-[clamp(0.5rem,1.8vw,0.7rem)]">
            {song.artist}
          </p>
        </>
      ) : (
        <p className="label-caps text-ink-soft text-[clamp(0.5rem,1.8vw,0.7rem)]">
          Insert a track
        </p>
      )}
    </div>
  );
}

import type { CassetteSong } from "./types";

interface NowPlayingInfoProps {
  song?: CassetteSong | null;
  isPlaying: boolean;
  isLoading?: boolean;
}

/**
 * A small status caption beneath the cassette (Task 6.1). The full Now Playing
 * bar with external links + favorite lands in Phase 8; this is the in-player
 * state line.
 */
export function NowPlayingInfo({
  song,
  isPlaying,
  isLoading,
}: NowPlayingInfoProps) {
  let status: string;
  if (isLoading) status = "Loading…";
  else if (!song) status = "Press play to start";
  else if (isPlaying) status = "Now playing";
  else status = "Paused";

  return (
    <p
      className="label-caps mt-6 flex items-center justify-center gap-2 text-ink-soft"
      aria-live="polite"
    >
      <span
        className={
          isPlaying && !isLoading
            ? "inline-block size-2 rounded-full bg-accent"
            : "inline-block size-2 rounded-full bg-ink-soft/40"
        }
      />
      {status}
    </p>
  );
}

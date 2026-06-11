import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";

import type { Song } from "../../types/song";

interface NowPlayingProps {
  song: Song | null;
  isFavorite: boolean;
  onToggleFavorite: (song: Song) => void;
}

/**
 * Fixed footer bar showing the current track with a favorite toggle
 * (Tasks 8.7, 8.8). Audio plays inline via the HTMLAudioElement managed by
 * usePlayer. The favorite action is auth-gated upstream.
 */
export function NowPlaying({
  song,
  isFavorite,
  onToggleFavorite,
}: NowPlayingProps) {
  return (
    <AnimatePresence>
      {song && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-30 flex justify-center p-4"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        >
          <div className="glass-card flex w-full max-w-xl items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-ink text-sm font-medium normal-case">
                {song.title}
              </p>
              <p className="label-caps truncate text-ink-soft text-[0.6rem]">
                {song.artist} · {song.genre}
              </p>
            </div>

            <button
              type="button"
              aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
              aria-pressed={isFavorite}
              onClick={() => onToggleFavorite(song)}
              className={`grid size-10 place-items-center rounded-full border transition-colors ${
                isFavorite
                  ? "border-line-warm bg-accent/15 text-accent"
                  : "border-line/30 text-ink-soft hover:text-ink"
              }`}
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                size={18}
                strokeWidth={isFavorite ? 2.4 : 1.8}
              />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

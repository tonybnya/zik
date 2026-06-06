import { motion, useReducedMotion } from "motion/react";

import { CassetteBody } from "./CassetteBody";
import { CassetteLabel } from "./CassetteLabel";
import { PlayButton } from "./PlayButton";
import { NowPlayingInfo } from "./NowPlayingInfo";
import type { CassettePlayerProps } from "./types";

/**
 * The ZIK cassette player — the app's visual centerpiece (Phase 6).
 *
 * Presentational: the page owns play state and song fetching and passes them
 * in. Composes the SVG body (reels + window) with HTML overlays for the label
 * and play button, adds an idle breathing float, and scales fluidly from mobile
 * to desktop. All motion respects `prefers-reduced-motion`.
 */
export function CassettePlayer({
  isPlaying,
  onPlayToggle,
  song = null,
  isLoading = false,
  className,
}: CassettePlayerProps) {
  const reduced = useReducedMotion() ?? false;
  const idle = isPlaying || reduced;

  return (
    <div
      className={`mx-auto w-full max-w-[560px] ${className ?? ""}`}
      data-playing={isPlaying}
    >
      <div className="relative">
        {/* Soft floor shadow */}
        <div
          aria-hidden
          className="absolute inset-x-[12%] bottom-[-6%] h-[10%] rounded-[50%] bg-ink/25 blur-xl"
        />

        <motion.figure
          className="relative m-0"
          animate={
            idle
              ? { y: 0, rotate: 0 }
              : { y: [0, -7, 0], rotate: [0, -0.5, 0] }
          }
          transition={
            idle
              ? { duration: 0.4 }
              : { repeat: Infinity, duration: 6, ease: "easeInOut" }
          }
        >
          <CassetteBody playing={isPlaying} reduced={reduced} />
          <CassetteLabel song={song} />

          <div className="absolute left-1/2 top-[51%] -translate-x-1/2 -translate-y-1/2">
            <PlayButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              onClick={onPlayToggle}
            />
          </div>
        </motion.figure>
      </div>

      <NowPlayingInfo song={song} isPlaying={isPlaying} isLoading={isLoading} />
    </div>
  );
}

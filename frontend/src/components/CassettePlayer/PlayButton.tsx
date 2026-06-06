import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, PauseIcon, Loading03Icon } from "@hugeicons/core-free-icons";

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

/**
 * The large center control (Task 6.6). Sits over the tape window between the
 * reels. Triggers the play/pause toggle; shows a spinner while a track loads.
 */
export function PlayButton({ isPlaying, isLoading, onClick }: PlayButtonProps) {
  const label = isLoading ? "Loading track" : isPlaying ? "Pause" : "Play";
  const icon = isLoading ? Loading03Icon : isPlaying ? PauseIcon : PlayIcon;

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={isPlaying}
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="grid aspect-square w-[clamp(52px,17%,84px)] place-items-center rounded-full bg-accent text-neutral shadow-[var(--shadow-glow),var(--shadow-elevated)] ring-2 ring-[rgba(255,255,255,0.35)] transition-colors disabled:cursor-wait disabled:opacity-90"
    >
      <HugeiconsIcon
        icon={icon}
        size={34}
        strokeWidth={2}
        className={isLoading ? "animate-spin" : isPlaying ? "" : "translate-x-[2px]"}
      />
    </motion.button>
  );
}

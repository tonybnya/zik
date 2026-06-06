import { motion } from "motion/react";

interface TapeWindowProps {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Animate the tape sliding while true. */
  playing: boolean;
  reduced: boolean;
}

/**
 * The window cut-out between the reels showing the dark tape ribbon (Task 6.4).
 * On play, faint speckle ticks slide across to suggest the tape moving from one
 * reel to the other (Task 6.7). Everything is clipped to the window bounds.
 */
export function TapeWindow({
  x,
  y,
  width,
  height,
  playing,
  reduced,
}: TapeWindowProps) {
  const clipId = "tape-window-clip";
  const ribbonY = y + height / 2;
  const ticks = Array.from({ length: 6 }, (_, i) => x + (width / 6) * i);

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={6} />
        </clipPath>
      </defs>

      <rect x={x} y={y} width={width} height={height} rx={6} fill="#1f1b18" />
      {/* Tape surface */}
      <rect
        x={x}
        y={ribbonY - 7}
        width={width}
        height={14}
        fill="#3a322c"
        clipPath={`url(#${clipId})`}
      />

      {/* Moving speckle — slides left→right on a loop while playing */}
      <g clipPath={`url(#${clipId})`}>
        <motion.g
          animate={
            playing && !reduced ? { x: [0, width / 6] } : { x: 0 }
          }
          transition={
            playing && !reduced
              ? { repeat: Infinity, ease: "linear", duration: 0.7 }
              : { duration: 0.3 }
          }
        >
          {ticks.map((tx, i) => (
            <line
              key={`tick-${i}`}
              x1={tx}
              y1={ribbonY - 6}
              x2={tx}
              y2={ribbonY + 6}
              stroke="#5a4d42"
              strokeWidth={1.5}
            />
          ))}
        </motion.g>
      </g>

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="none"
        stroke="#0f0d0b"
        strokeWidth={1.5}
      />
    </g>
  );
}

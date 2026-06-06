import { motion } from "motion/react";

interface TapeReelProps {
  cx: number;
  cy: number;
  radius: number;
  /** Spin continuously while true. */
  playing: boolean;
  /** Skip motion for users who prefer reduced motion. */
  reduced: boolean;
  /** Seconds per rotation — left/right reels differ slightly for life. */
  duration?: number;
}

const TOOTH_COUNT = 18;
const SPOKE_COUNT = 6;

/**
 * A spoked cassette reel (Task 6.3). Rotates about its own center via Framer
 * Motion when playing. Geometry is generated from the center + radius so both
 * reels share one component.
 */
export function TapeReel({
  cx,
  cy,
  radius,
  playing,
  reduced,
  duration = 2.6,
}: TapeReelProps) {
  const toothR = radius * 0.82;
  const hubR = radius * 0.36;
  const holeR = radius * 0.13;

  const teeth = Array.from({ length: TOOTH_COUNT }, (_, i) => {
    const a = (i / TOOTH_COUNT) * Math.PI * 2;
    return {
      x1: cx + Math.cos(a) * toothR,
      y1: cy + Math.sin(a) * toothR,
      x2: cx + Math.cos(a) * radius * 0.94,
      y2: cy + Math.sin(a) * radius * 0.94,
    };
  });

  const spokes = Array.from({ length: SPOKE_COUNT }, (_, i) => {
    const a = (i / SPOKE_COUNT) * Math.PI * 2;
    return {
      x: cx + Math.cos(a) * (hubR + 1),
      y: cy + Math.sin(a) * (hubR + 1),
      x2: cx + Math.cos(a) * (toothR - 2),
      y2: cy + Math.sin(a) * (toothR - 2),
    };
  });

  return (
    <motion.g
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      animate={playing && !reduced ? { rotate: 360 } : { rotate: 0 }}
      transition={
        playing && !reduced
          ? { repeat: Infinity, ease: "linear", duration }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
      }
    >
      <circle cx={cx} cy={cy} r={radius} fill="#f6eed8" stroke="#b9a07e" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={toothR} fill="none" stroke="#cbb491" strokeWidth={1} />
      {teeth.map((t, i) => (
        <line
          key={`tooth-${i}`}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="#b9a07e"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {spokes.map((s, i) => (
        <line
          key={`spoke-${i}`}
          x1={s.x}
          y1={s.y}
          x2={s.x2}
          y2={s.y2}
          stroke="#cbb491"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy={cy} r={hubR} fill="#efe3c7" stroke="#b9a07e" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={holeR} fill="#241f1c" />
    </motion.g>
  );
}

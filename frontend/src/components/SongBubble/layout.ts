/**
 * Deterministic orbit placement for song bubbles (Task 7.3).
 *
 * Positions are derived from the bubble's index (even distribution around the
 * cassette) plus a stable per-song jitter, so a bubble keeps its spot across
 * re-renders instead of jumping. Offsets are returned in `vmin` units so the
 * field scales with the viewport.
 */

/** FNV-1a hash → a stable pseudo-random number in [0, 1) for a given seed. */
export function seededUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export interface BubbleOffset {
  /** Horizontal offset from the cassette center, in vmin. */
  dx: number;
  /** Vertical offset from the cassette center, in vmin. */
  dy: number;
}

const BASE_RADIUS = 32; // vmin
const RADIUS_JITTER = 12; // vmin

export function computeOffset(
  id: number | string,
  index: number,
  count: number,
): BubbleOffset {
  const key = String(id);
  // Even base angle, starting at the top, plus a bounded per-song wobble.
  const baseAngle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
  const wobble =
    (seededUnit(key) - 0.5) * ((Math.PI * 2) / Math.max(count, 1)) * 0.7;
  const angle = baseAngle + wobble;
  const radius = BASE_RADIUS + seededUnit(`${key}:r`) * RADIUS_JITTER;

  return {
    dx: Math.cos(angle) * radius,
    dy: Math.sin(angle) * radius,
  };
}

/**
 * Phase 9 — 404 Not Found page. A retro cassette "broken tape" visual: the
 * ribbon has snapped in two and the halves drift apart, very slowly. Clicking
 * "Rewind Home" calls navigate('/') so the user gets back to the player.
 */
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";

/**
 * The broken-tape mark (Tasks 9.2, 9.4). Two halves of a dark cassette ribbon
 * floating apart with a frayed snap between them. The two pieces drift in
 * opposite directions with a slow easeInOut loop and respect reduced-motion.
 */
function BrokenTape() {
  const reduced = useReducedMotion() ?? false;
  const halfW = 64;
  const halfH = 14;
  const gap = 18;
  const yCenter = 22;

  return (
    <svg
      viewBox="0 0 160 64"
      width="160"
      height="64"
      role="img"
      aria-label="Broken cassette tape"
      className="overflow-visible"
    >
      <defs>
        <pattern
          id="nf-tape-ticks"
          width="8"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <line x1="4" y1="0" x2="4" y2="6" stroke="#5a4d42" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Left half: drifts left, tilts up. */}
      <motion.g
        animate={reduced ? { x: 0, rotate: 0 } : { x: [-2, -8, -2], rotate: [-2, -4, -2] }}
        transition={
          reduced
            ? { duration: 0.2 }
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformOrigin: `${halfW}px ${yCenter}px` }}
      >
        <rect
          x={0}
          y={yCenter - halfH / 2}
          width={halfW}
          height={halfH}
          rx={2}
          fill="#3a322c"
        />
        <rect
          x={0}
          y={yCenter - halfH / 2}
          width={halfW}
          height={halfH}
          rx={2}
          fill="url(#nf-tape-ticks)"
        />
        {/* frayed right edge */}
        <polygon
          points={`${halfW},${yCenter - halfH / 2} ${halfW + 6},${yCenter - 3} ${halfW + 2},${yCenter} ${halfW + 7},${yCenter + 3} ${halfW},${yCenter + halfH / 2}`}
          fill="#3a322c"
        />
      </motion.g>

      {/* Right half: drifts right, tilts down. */}
      <motion.g
        animate={reduced ? { x: 0, rotate: 0 } : { x: [2, 8, 2], rotate: [2, 4, 2] }}
        transition={
          reduced
            ? { duration: 0.2 }
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          transformOrigin: `${halfW + gap}px ${yCenter}px`,
        }}
      >
        <rect
          x={halfW + gap}
          y={yCenter - halfH / 2}
          width={halfW}
          height={halfH}
          rx={2}
          fill="#3a322c"
        />
        <rect
          x={halfW + gap}
          y={yCenter - halfH / 2}
          width={halfW}
          height={halfH}
          rx={2}
          fill="url(#nf-tape-ticks)"
        />
        {/* frayed left edge */}
        <polygon
          points={`${halfW + gap},${yCenter - halfH / 2} ${halfW + gap - 6},${yCenter - 3} ${halfW + gap - 2},${yCenter} ${halfW + gap - 7},${yCenter + 3} ${halfW + gap},${yCenter + halfH / 2}`}
          fill="#3a322c"
        />
      </motion.g>
    </svg>
  );
}

/**
 * The 404 view (Phase 9). Stays on-brand: warm cream background, JetBrains
 * Mono, amber accents, the same `surface-shell` card frame used by the auth
 * modal. The "Rewind Home" button calls react-router's navigate('/').
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <motion.main
      className="relative grid min-h-dvh place-items-center px-4 py-16"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Soft amber glow behind the card, matches the landing page ambient. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[100px]"
      />

      <div className="surface-shell relative w-full max-w-md">
        <div className="bg-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <p
            className="label-caps text-ink-soft"
            aria-label="Status code 404"
          >
            Side A · Track 404
          </p>

          <h1 className="text-display-lg text-ink">404</h1>

          <div className="my-2">
            <BrokenTape />
          </div>

          <p className="text-body-md text-ink-soft normal-case tracking-normal">
            The tape has snapped.
          </p>

          <p className="label-caps text-ink-soft">Track Not Found</p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-primary mt-4 gap-2 px-6 py-2.5"
          >
            <RewindGlyph />
            Rewind Home
          </button>
        </div>
      </div>
    </motion.main>
  );
}

/** A tiny rewind glyph (two left-pointing triangles) for the button. */
function RewindGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      aria-hidden
    >
      <polygon points="7,2 1,7 7,12" />
      <polygon points="13,2 7,7 13,12" />
    </svg>
  );
}
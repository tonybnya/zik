import { useReducedMotion } from "motion/react";

/**
 * Loading skeleton shown while a lazy-loaded page chunk resolves (Task 12.4).
 * Kept deliberately generic so it can fall back for any route. Honors
 * prefers-reduced-motion by skipping the pulse animation.
 */
export function PageSkeleton() {
  const reduced = useReducedMotion() ?? false;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12"
      data-testid="page-skeleton"
    >
      <div
        className={
          "h-32 w-32 rounded-full border border-line/30 bg-card/60 " +
          (reduced ? "" : "animate-pulse")
        }
      />
      <div className="flex flex-col items-center gap-2">
        <div
          className={
            "h-4 w-40 rounded bg-card/60 " + (reduced ? "" : "animate-pulse")
          }
        />
        <div
          className={
            "h-3 w-24 rounded bg-card/40 " + (reduced ? "" : "animate-pulse")
          }
        />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

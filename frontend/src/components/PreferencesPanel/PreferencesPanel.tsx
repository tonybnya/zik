import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import type { Preferences } from "../../lib/api";
import { GENRES, MOODS } from "./taxonomy";

interface PreferencesPanelProps {
  /** Initial preference state — typically what the backend returned. */
  initial: Preferences;
  /** Persist handler. Receives the trimmed selections on save. */
  onSave: (next: Preferences) => Promise<void> | void;
  /** Dismiss handler — the panel close button + ESC + backdrop click. */
  onClose: () => void;
  /** Disabled while a save is in flight. */
  isSaving?: boolean;
  /** Override the title (e.g. "Tune your taste" vs. "Edit preferences"). */
  title?: string;
}

/**
 * Modal preferences editor (Task 11.2). Multi-select chips for genres and
 * moods; ESC + backdrop close; Save persists via `onSave`. Animations honor
 * `prefers-reduced-motion`. Self-contained — does not fetch or own the
 * network call.
 */
export function PreferencesPanel({
  initial,
  onSave,
  onClose,
  isSaving = false,
  title = "Tune your taste",
}: PreferencesPanelProps) {
  const reduced = useReducedMotion() ?? false;
  const [genres, setGenres] = useState<Set<string>>(
    () => new Set(initial.preferredGenres),
  );
  const [moods, setMoods] = useState<Set<string>>(
    () => new Set(initial.preferredMoods),
  );
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Move focus into the panel on mount.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const toggleGenre = (g: string) => {
    setGenres((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const toggleMood = (m: string) => {
    setMoods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const handleSave = async () => {
    await onSave({
      preferredGenres: Array.from(genres).sort(),
      preferredMoods: Array.from(moods).sort(),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="prefs-backdrop"
        role="presentation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm"
        data-testid="prefs-backdrop"
      >
        <motion.div
          ref={panelRef}
          key="prefs-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prefs-title"
          tabIndex={-1}
          initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[min(560px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-lg border border-line/30 bg-card p-6 shadow-[var(--shadow-elevated)]"
        >
          <button
            type="button"
            aria-label="Close preferences"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded text-ink-soft transition hover:bg-line/20 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>

          <h2
            id="prefs-title"
            className="mb-1 text-display-sm text-ink normal-case tracking-normal"
          >
            {title}
          </h2>
          <p className="mb-5 text-body-md text-ink-soft">
            Pick the sounds you want more of. Leave empty for a balanced mix.
          </p>

          <section aria-labelledby="prefs-genres-label" className="mb-6">
            <h3
              id="prefs-genres-label"
              className="mb-2 text-label-md uppercase tracking-wider text-ink-soft"
            >
              Genres
            </h3>
            <div role="group" className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const on = genres.has(g);
                return (
                  <button
                    key={g}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleGenre(g)}
                    className={
                      "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm transition " +
                      (on
                        ? "border-accent bg-accent/15 text-ink shadow-[var(--shadow-glow)]"
                        : "border-line/30 bg-card text-ink-soft hover:border-line hover:text-ink")
                    }
                  >
                    {on && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={14}
                        className="text-accent"
                      />
                    )}
                    {g}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="prefs-moods-label" className="mb-6">
            <h3
              id="prefs-moods-label"
              className="mb-2 text-label-md uppercase tracking-wider text-ink-soft"
            >
              Moods
            </h3>
            <div role="group" className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const on = moods.has(m);
                return (
                  <button
                    key={m}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleMood(m)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm transition " +
                      (on
                        ? "border-accent bg-accent/15 text-ink shadow-[var(--shadow-glow)]"
                        : "border-line/30 bg-card text-ink-soft hover:border-line hover:text-ink")
                    }
                  >
                    {on && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={14}
                        className="text-accent"
                      />
                    )}
                    {m}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-line/30 px-4 py-2 text-body-md text-ink-soft transition hover:bg-line/15 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded border border-accent bg-accent px-4 py-2 text-body-md text-neutral shadow-[var(--shadow-glow)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

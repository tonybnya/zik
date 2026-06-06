import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SparklesIcon } from "@hugeicons/core-free-icons";

import { PreferencesPanel } from "./PreferencesPanel";
import type { Preferences } from "../../lib/api";

interface PreferencePromptProps {
  /** Whether the underlying state is ready (signed in + loaded). */
  enabled: boolean;
  /** Current preferences from usePreferences. */
  preferences: Preferences | null;
  /** Persist handler from usePreferences.save. */
  onSave: (next: Preferences) => Promise<void>;
  /** Persist "don't show again" for this session. */
  onDismiss: () => void;
  /** Whether the save is in flight. */
  isSaving?: boolean;
}

/**
 * Inline nudge that appears after the user's 2nd play when they haven't set
 * preferences yet (Task 11.4). Two dismissible affordances: the "X" closes
 * it for this session; "Pick" opens the PreferencesPanel modal.
 */
export function PreferencePrompt({
  enabled,
  preferences,
  onSave,
  onDismiss,
  isSaving = false,
}: PreferencePromptProps) {
  const reduced = useReducedMotion() ?? false;
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {enabled && (
          <motion.div
            key="prefs-prompt"
            role="status"
            data-testid="preference-prompt"
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 8 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: "easeOut" }}
            className="mt-6 flex items-center gap-3 rounded-md border border-line/30 bg-card/90 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur"
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={18}
              className="shrink-0 text-accent"
            />
            <p className="flex-1 text-body-md text-ink normal-case tracking-normal">
              Want a tape that knows your taste?
            </p>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="rounded border border-accent bg-accent px-3 py-1.5 text-body-sm text-neutral shadow-[var(--shadow-glow)] transition hover:brightness-110"
            >
              Pick
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss preference prompt"
              className="grid size-8 place-items-center rounded text-ink-soft transition hover:bg-line/15 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {panelOpen && preferences && (
        <PreferencesPanel
          initial={preferences}
          onSave={async (next) => {
            await onSave(next);
            setPanelOpen(false);
          }}
          onClose={() => setPanelOpen(false)}
          isSaving={isSaving}
        />
      )}
    </>
  );
}

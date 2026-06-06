import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth";
import {
  ApiError,
  fetchPreferences,
  updatePreferences,
} from "../lib/api";
import type { Preferences } from "../lib/api";

export interface UsePreferencesResult {
  /** Loaded preferences, or null while loading / when signed out. */
  preferences: Preferences | null;
  /** True when at least one genre or mood is set. */
  hasPreferences: boolean;
  /** Persist the user's selections and update local state. */
  save: (next: Preferences) => Promise<void>;
  /** Force a re-fetch (e.g. after the user edits elsewhere). */
  refresh: () => Promise<void>;
}

/**
 * Owns the user's preference state (Task 11.2 / 11.3). Loads on mount when
 * signed in; auto-creates an empty record server-side. `save` PUTs the new
 * selections and updates local state so callers (PreferencePrompt,
 * PreferencesPanel) react immediately.
 */
export function usePreferences(): UsePreferencesResult {
  const { isSignedIn, getToken } = useAuth();
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  // The load effect: setState happens inside an async callback (not the effect
  // body), so it's allowed by `react-hooks/set-state-in-effect`. The token
  // fetch is async; we cannot call setState in a non-callback position.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const next = await fetchPreferences(token);
        if (!cancelled) setPreferences(next);
      } catch {
        // Non-fatal: leave preferences as null.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  const save = useCallback(
    async (next: Preferences) => {
      const token = await getToken();
      try {
        const saved = await updatePreferences(token, next);
        setPreferences(saved);
      } catch (err) {
        if (err instanceof ApiError) {
          throw err;
        }
        throw new ApiError("Couldn't save preferences.", 0, "network_error");
      }
    },
    [getToken],
  );

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      const next = await fetchPreferences(token);
      setPreferences(next);
    } catch {
      // Non-fatal.
    }
  }, [getToken]);

  // When signed out, the loaded state isn't meaningful to callers.
  const visiblePreferences = isSignedIn ? preferences : null;
  const hasPreferences = Boolean(
    visiblePreferences &&
      (visiblePreferences.preferredGenres.length > 0 ||
        visiblePreferences.preferredMoods.length > 0),
  );

  return {
    preferences: visiblePreferences,
    hasPreferences,
    save,
    refresh,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth";
import {
  fetchRandomSong,
  fetchSimilarSongs,
  fetchFavorites,
  toggleFavorite as apiToggleFavorite,
  logPlay,
  ApiError,
} from "../lib/api";
import type { Song } from "../types/song";

export interface PlayerState {
  song: Song | null;
  similar: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  favoriteIds: Set<number>;
  /** Fetch a random song, play it, and load similar songs. */
  playRandom: () => Promise<void>;
  /** Toggle play/pause; on the very first play, fetches a random song. */
  togglePlay: () => void;
  /** Switch to a bubble's song and refresh similar songs. */
  selectSong: (song: Song) => Promise<void>;
  /** Toggle favorite for the current song (auth required). */
  toggleFavorite: (song: Song) => Promise<void>;
}

/**
 * Owns the landing page's playback state and API wiring (Tasks 8.5, 8.6, 8.8).
 * Presentational components receive these values and callbacks.
 */
export function usePlayer(): PlayerState {
  const { isSignedIn, getToken, openSignIn } = useAuth();

  const [song, setSong] = useState<Song | null>(null);
  const [similar, setSimilar] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The ids we've fetched for the current sign-in. Derived to an empty set
  // when signed out so callers never see stale data on sign-out.
  const [signedInFavoriteIds, setSignedInFavoriteIds] = useState<Set<number>>(
    new Set(),
  );

  // Keep favorites in sync with auth state.
  useEffect(() => {
    let cancelled = false;
    if (!isSignedIn) {
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const favs = await fetchFavorites(token);
        if (!cancelled) {
          setSignedInFavoriteIds(new Set(favs.map((f) => Number(f.id))));
        }
      } catch {
        // Non-fatal: favorites just stay empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  const favoriteIds = useMemo(
    () => (isSignedIn ? signedInFavoriteIds : new Set<number>()),
    [isSignedIn, signedInFavoriteIds],
  );

  const loadSimilar = useCallback(async (id: number | string) => {
    try {
      setSimilar(await fetchSimilarSongs(id));
    } catch {
      setSimilar([]);
    }
  }, []);

  const playRandom = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchRandomSong();
      setSong(next);
      setIsPlaying(true);
      await loadSimilar(next.id);
      const token = isSignedIn ? await getToken() : null;
      void logPlay(Number(next.id), token);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong.";
      setError(message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [loadSimilar, isSignedIn, getToken]);

  const togglePlay = useCallback(() => {
    if (!song) {
      void playRandom();
      return;
    }
    setIsPlaying((p) => !p);
  }, [song, playRandom]);

  const selectSong = useCallback(
    async (next: Song) => {
      setSong(next);
      setIsPlaying(true);
      setError(null);
      await loadSimilar(next.id);
      const token = isSignedIn ? await getToken() : null;
      void logPlay(Number(next.id), token);
    },
    [loadSimilar, isSignedIn, getToken],
  );

  const toggleFavorite = useCallback(
    async (target: Song) => {
      if (!isSignedIn) {
        openSignIn();
        return;
      }
      const id = Number(target.id);
      // Optimistic update.
      setSignedInFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        const token = await getToken();
        const favorited = await apiToggleFavorite(id, token);
        setSignedInFavoriteIds((prev) => {
          const next = new Set(prev);
          if (favorited) next.add(id);
          else next.delete(id);
          return next;
        });
      } catch {
        // Revert on failure.
        setSignedInFavoriteIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    },
    [isSignedIn, getToken, openSignIn],
  );

  return {
    song,
    similar,
    isPlaying,
    isLoading,
    error,
    favoriteIds,
    playRandom,
    togglePlay,
    selectSong,
    toggleFavorite,
  };
}

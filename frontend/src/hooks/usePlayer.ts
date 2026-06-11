import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../auth";
import {
  fetchRandomSong,
  fetchSimilarSongs,
  fetchFavorites,
  fetchRecommendations,
  toggleFavorite as apiToggleFavorite,
  logPlay,
  ApiError,
} from "../lib/api";
import type { Song } from "../types/song";

/** Number of plays before AI suggestions become available (Task 10.6). */
export const AI_TRIGGER_PLAYS = 3;

export interface PlayerState {
  song: Song | null;
  similar: Song[];
  aiSuggestions: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  favoriteIds: Set<number>;
  playCount: number;
  /** Fetch a random song, play it, and load similar songs. */
  playRandom: () => Promise<void>;
  /** Toggle play/pause; on the very first play, fetches a random song. */
  togglePlay: () => Promise<void>;
  /** Switch to a bubble's song and refresh similar songs. */
  selectSong: (song: Song) => Promise<void>;
  /** Toggle favorite for the current song (auth required). */
  toggleFavorite: (song: Song) => Promise<void>;
}

const audioRef: { current: HTMLAudioElement | null } = { current: null };

function getAudio(): HTMLAudioElement {
  if (!audioRef.current) {
    audioRef.current = new Audio();
  }
  return audioRef.current;
}

/**
 * Owns the landing page's playback state and API wiring (Tasks 8.5, 8.6, 8.8,
 * 10.6). Presentational components receive these values and callbacks.
 */
export function usePlayer(): PlayerState {
  const { isSignedIn, getToken, openSignIn } = useAuth();

  const [song, setSong] = useState<Song | null>(null);
  const [similar, setSimilar] = useState<Song[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The ids we've fetched for the current sign-in. Derived to an empty set
  // when signed out so callers never see stale data on sign-out.
  const [signedInFavoriteIds, setSignedInFavoriteIds] = useState<Set<number>>(
    new Set(),
  );
  const [playCount, setPlayCount] = useState(0);

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

  // Sync isPlaying with the audio element's actual state.
  useEffect(() => {
    const audio = getAudio();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

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

  // Trigger the AI-suggestions fetch once the user has played enough songs.
  // useRef guards against a double-fetch under StrictMode.
  const aiFetched = useRef(false);
  useEffect(() => {
    if (aiFetched.current) return;
    if (!isSignedIn) return;
    if (playCount < AI_TRIGGER_PLAYS) return;
    aiFetched.current = true;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const resp = await fetchRecommendations(token);
        if (cancelled) return;
        const mapped: Song[] = resp.songs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          genre: s.genre,
          moods: s.moods ?? [],
          bpm: s.bpm,
          externalUrl: s.external_url,
          coverUrl: s.cover_url,
          isAiPick: true,
        }));
        setAiSuggestions(mapped);
      } catch {
        // Non-fatal: AI suggestions just stay empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playCount, isSignedIn, getToken]);

  const playSong = useCallback(async (next: Song) => {
    setSong(next);
    setError(null);
    setIsPlaying(true);
    setPlayCount((c) => c + 1);
    await loadSimilar(next.id);
    const token = isSignedIn ? await getToken() : null;
    void logPlay(Number(next.id), token);
    const audio = getAudio();
    if (next.audioUrl) {
      audio.src = next.audioUrl;
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    }
  }, [loadSimilar, isSignedIn, getToken]);

  const playRandom = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchRandomSong();
      await playSong(next);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong.";
      setError(message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [playSong]);

  const togglePlay = useCallback(() => {
    if (!song) {
      void playRandom();
      return;
    }
    if (isPlaying) {
      const audio = getAudio();
      audio.pause();
      setIsPlaying(false);
    } else {
      const audio = getAudio();
      if (song.audioUrl) {
        if (!audio.src) audio.src = song.audioUrl;
        const p = audio.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        setIsPlaying(true);
      }
    }
  }, [song, playRandom, isPlaying]);

  const selectSong = useCallback(
    async (next: Song) => {
      await playSong(next);
    },
    [playSong],
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
    aiSuggestions,
    isPlaying,
    isLoading,
    error,
    favoriteIds,
    playCount,
    playRandom,
    togglePlay,
    selectSong,
    toggleFavorite,
  };
}

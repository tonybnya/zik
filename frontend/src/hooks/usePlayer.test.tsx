import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePlayer } from "./usePlayer";
import type { Song } from "../types/song";

// Stable shared mock state — must be hoisted so the module factory can close
// over it. Keeping the auth object AND its function members as stable references
// avoids the infinite re-render loop that fresh-per-render mocks cause
// (usePlayer's useEffect depends on getToken, so a new function every render
// makes the effect re-fire forever).
const {
  openSignIn,
  getToken,
  auth,
} = vi.hoisted(() => ({
  openSignIn: vi.fn(),
  getToken: vi.fn(async () => null as string | null),
  auth: { isSignedIn: false as boolean },
}));

vi.mock("../auth", () => ({
  useAuth: () => ({
    isSignedIn: auth.isSignedIn,
    getToken,
    openSignIn,
  }),
}));

vi.mock("../lib/api", () => ({
  fetchRandomSong: vi.fn(),
  fetchSimilarSongs: vi.fn(),
  fetchFavorites: vi.fn(),
  toggleFavorite: vi.fn(),
  logPlay: vi.fn(),
  ApiError: class extends Error {},
}));

import * as api from "../lib/api";

const SONG: Song = {
  id: 1,
  title: "A",
  artist: "X",
  genre: "lofi",
  moods: ["calm"],
  bpm: 70,
  externalUrl: "#",
  coverUrl: null,
};
const SIM: Song[] = [
  { ...SONG, id: 2, title: "B" },
  { ...SONG, id: 3, title: "C" },
];

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = false;
  getToken.mockImplementation(async () => null);
  vi.mocked(api.fetchRandomSong).mockResolvedValue(SONG);
  vi.mocked(api.fetchSimilarSongs).mockResolvedValue(SIM);
  vi.mocked(api.fetchFavorites).mockResolvedValue([]);
  vi.mocked(api.toggleFavorite).mockResolvedValue(true);
});

describe("usePlayer", () => {
  it("playRandom sets the song, plays, and loads similar songs", async () => {
    const { result } = renderHook(() => usePlayer());
    await act(async () => {
      await result.current.playRandom();
    });
    expect(result.current.song).toEqual(SONG);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.similar).toHaveLength(2);
  });

  it("togglePlay fetches a random song on first play, then pauses", async () => {
    const { result } = renderHook(() => usePlayer());
    await act(async () => {
      result.current.togglePlay();
    });
    expect(api.fetchRandomSong).toHaveBeenCalledOnce();
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.togglePlay();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("selectSong swaps the current song and refreshes similar", async () => {
    const { result } = renderHook(() => usePlayer());
    await act(async () => {
      await result.current.selectSong(SIM[0]);
    });
    expect(result.current.song).toEqual(SIM[0]);
    expect(api.fetchSimilarSongs).toHaveBeenCalledWith(2);
  });

  it("toggleFavorite prompts sign-in when signed out and skips the API", async () => {
    const { result } = renderHook(() => usePlayer());
    await act(async () => {
      await result.current.toggleFavorite(SONG);
    });
    expect(openSignIn).toHaveBeenCalledOnce();
    expect(api.toggleFavorite).not.toHaveBeenCalled();
  });

  it("toggleFavorite calls the API and tracks the id when signed in", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    const { result } = renderHook(() => usePlayer());
    await act(async () => {
      await result.current.toggleFavorite(SONG);
    });
    expect(api.toggleFavorite).toHaveBeenCalledWith(1, "tok");
    expect(result.current.favoriteIds.has(1)).toBe(true);
  });
});

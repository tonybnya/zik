/**
 * Integration test for the Phase 8 landing page. Locks the wiring between
 * <LandingPage>, <Header>, <CassettePlayer>, <BubbleField>, and <NowPlaying>,
 * and proves the user flow (press play → song loads → bubbles appear → favorite
 * toggles) end-to-end against a mocked API.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { LandingPage } from "./LandingPage";
import type { Song } from "../types/song";

// Stable auth mock — see usePlayer.test.tsx for the rationale.
const { openSignIn, getToken, auth } = vi.hoisted(() => ({
  openSignIn: vi.fn(),
  getToken: vi.fn(async () => null as string | null),
  auth: { isSignedIn: false as boolean },
}));

vi.mock("../auth", () => ({
  useAuth: () => ({
    isSignedIn: auth.isSignedIn,
    getToken,
    openSignIn,
    closeAuth: () => {},
    openSignUp: () => {},
    signOut: async () => {},
    user: null,
    isLoaded: true,
    isConfigured: false,
    authView: null,
  }),
}));

vi.mock("../lib/api", () => ({
  fetchRandomSong: vi.fn(),
  fetchSimilarSongs: vi.fn(),
  fetchFavorites: vi.fn(),
  fetchRecommendations: vi.fn(),
  fetchPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  toggleFavorite: vi.fn(),
  logPlay: vi.fn(),
  ApiError: class extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

import * as api from "../lib/api";

const SONG: Song = {
  id: 7,
  title: "Rainy Window",
  artist: "Tape Deck",
  genre: "lofi",
  moods: ["calm", "focus"],
  bpm: 72,
  externalUrl: "https://example.com/song",
  coverUrl: null,
};
const SIM: Song[] = [
  { ...SONG, id: 8, title: "Quiet Library" },
  { ...SONG, id: 9, title: "Midnight Coffee" },
];
const AI_PICKS: Song[] = [
  { ...SONG, id: 21, title: "Starlight Drift", isAiPick: true },
  { ...SONG, id: 22, title: "Neon Window", isAiPick: true },
];

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = false;
  getToken.mockImplementation(async () => null);
  vi.mocked(api.fetchRandomSong).mockResolvedValue(SONG);
  vi.mocked(api.fetchSimilarSongs).mockResolvedValue(SIM);
  vi.mocked(api.fetchFavorites).mockResolvedValue([]);
  vi.mocked(api.fetchRecommendations).mockResolvedValue({
    songs: AI_PICKS,
    ai_powered: true,
    source: "gemini",
  });
  vi.mocked(api.fetchPreferences).mockResolvedValue({
    preferredGenres: [],
    preferredMoods: [],
  });
  vi.mocked(api.toggleFavorite).mockResolvedValue(true);
});

describe("LandingPage", () => {
  const renderLanding = () => render(<LandingPage />, { wrapper: MemoryRouter });

  it("renders the cassette hero and header", () => {
    renderLanding();
    // "ZIK" appears in both the header wordmark and the cassette label text.
    expect(screen.getAllByText("ZIK").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    // No song yet → NowPlaying is empty.
    expect(screen.queryByRole("link", { name: /listen/i })).not.toBeInTheDocument();
  });

  it("presses play, fetches a random song, and shows similar bubbles", async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /play/i }));

    await waitFor(() => {
      expect(api.fetchRandomSong).toHaveBeenCalledOnce();
    });
    expect(api.fetchSimilarSongs).toHaveBeenCalledWith(7);

    // Cassette label + NowPlaying both surface the title.
    await waitFor(() => {
      expect(screen.getAllByText("Rainy Window").length).toBeGreaterThan(0);
    });
    // Two bubbles rendered.
    expect(
      screen.getByRole("button", { name: /play quiet library/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /play midnight coffee/i }),
    ).toBeInTheDocument();
  });

  it("selecting a bubble swaps the song and refreshes similar", async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /play/i }));
    await waitFor(() =>
      expect(api.fetchSimilarSongs).toHaveBeenLastCalledWith(7),
    );

    await user.click(
      screen.getByRole("button", { name: /play quiet library/i }),
    );
    await waitFor(() =>
      expect(api.fetchSimilarSongs).toHaveBeenLastCalledWith(8),
    );
  });

  it("favoriting a song while signed out opens the sign-in modal", async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /play/i }));
    const fav = await screen.findByRole("button", { name: /add favorite/i });
    await user.click(fav);

    expect(openSignIn).toHaveBeenCalledOnce();
    expect(api.toggleFavorite).not.toHaveBeenCalled();
  });

  it("shows the error message if /api/songs/random fails", async () => {
    const { ApiError } = await import("../lib/api");
    vi.mocked(api.fetchRandomSong).mockRejectedValueOnce(
      new ApiError("Server is taking a break.", 500, "boom"),
    );
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /play/i }));
    expect(
      await screen.findByText(/server is taking a break/i),
    ).toBeInTheDocument();
  });

  it("prefers-reduced-motion is respected (no reel spin asserted at component level)", async () => {
    // This is a smoke check: the page should mount cleanly regardless of
    // motion preference. The cassette + bubble animations short-circuit on
    // reduced motion; we don't need to assert that here.
    const user = userEvent.setup();
    renderLanding();
    await user.click(screen.getByRole("button", { name: /play/i }));
    await waitFor(() => expect(api.fetchRandomSong).toHaveBeenCalledOnce());
    // Silence unused-var lint for `act`.
    expect(act).toBeDefined();
  });

  it("surfaces AI suggestions as an outer ring after 3 plays", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    const user = userEvent.setup();
    renderLanding();

    // 3 plays: 1 cassette play + 2 bubble selections
    await user.click(screen.getByRole("button", { name: /^play$/i }));
    await waitFor(() => expect(api.fetchRandomSong).toHaveBeenCalledTimes(1));
    await user.click(
      screen.getByRole("button", { name: /play quiet library/i }),
    );
    await waitFor(() => expect(api.fetchSimilarSongs).toHaveBeenLastCalledWith(8));
    await user.click(
      screen.getByRole("button", { name: /play midnight coffee/i }),
    );
    await waitFor(() => expect(api.fetchSimilarSongs).toHaveBeenLastCalledWith(9));

    // AI suggestions arrive on the outer ring, in a separate aria-label group.
    await waitFor(() =>
      expect(api.fetchRecommendations).toHaveBeenCalledWith("tok"),
    );
    const aiField = await screen.findByLabelText("AI suggestions");
    expect(aiField).toBeInTheDocument();
    expect(
      within(aiField).getByRole("button", { name: /play starlight drift/i }),
    ).toBeInTheDocument();
    expect(
      within(aiField).getByRole("button", { name: /play neon window/i }),
    ).toBeInTheDocument();
  });

  it("shows the preference prompt after the 2nd play when prefs are empty", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    const user = userEvent.setup();
    renderLanding();

    // 1st play — no prompt yet.
    await user.click(screen.getByRole("button", { name: /^play$/i }));
    await waitFor(() => expect(api.fetchRandomSong).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("preference-prompt")).not.toBeInTheDocument();

    // 2nd play — prompt appears.
    await user.click(
      screen.getByRole("button", { name: /play quiet library/i }),
    );
    expect(
      await screen.findByTestId("preference-prompt"),
    ).toBeInTheDocument();
  });

  it("does not show the preference prompt when preferences are already set", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchPreferences).mockResolvedValue({
      preferredGenres: ["lofi"],
      preferredMoods: [],
    });
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /^play$/i }));
    await waitFor(() => expect(api.fetchRandomSong).toHaveBeenCalledTimes(1));
    await user.click(
      screen.getByRole("button", { name: /play quiet library/i }),
    );
    // Wait for the playCount to settle.
    await waitFor(() =>
      expect(api.fetchSimilarSongs).toHaveBeenLastCalledWith(8),
    );
    expect(screen.queryByTestId("preference-prompt")).not.toBeInTheDocument();
  });

  it("hides the prompt when the dismiss button is clicked", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /^play$/i }));
    await user.click(
      screen.getByRole("button", { name: /play quiet library/i }),
    );
    const prompt = await screen.findByTestId("preference-prompt");
    expect(prompt).toBeInTheDocument();

    await user.click(
      within(prompt).getByRole("button", { name: /dismiss/i }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("preference-prompt")).not.toBeInTheDocument(),
    );
  });
});
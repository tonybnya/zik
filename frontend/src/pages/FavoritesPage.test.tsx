import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { FavoritesPage } from "./FavoritesPage";
import type { Song } from "../types/song";

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
  fetchFavorites: vi.fn(),
  toggleFavorite: vi.fn(),
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

const FAV_A: Song = {
  id: 7,
  title: "Rainy Window",
  artist: "Tape Deck",
  genre: "lofi",
  moods: ["calm"],
  bpm: 72,
  externalUrl: "https://example.com/a",
  coverUrl: null,
};
const FAV_B: Song = {
  ...FAV_A,
  id: 8,
  title: "Midnight Coffee",
  externalUrl: "https://example.com/b",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = false;
  getToken.mockImplementation(async () => null);
});

describe("FavoritesPage", () => {
  const renderPage = () =>
    render(<FavoritesPage />, { wrapper: MemoryRouter });

  it("shows a sign-in prompt when the user is not authenticated", () => {
    renderPage();
    expect(
      screen.getByText(/sign in to see your favorites/i),
    ).toBeInTheDocument();
    // The page-level CTA calls openSignIn; the Header also renders a "Sign in"
    // button when signed out. Both must be present.
    const signInButtons = screen.getAllByRole("button", { name: /sign in/i });
    expect(signInButtons.length).toBe(2);
    // The page-level one fires the openSignIn prop.
    expect(signInButtons.some((b) => b.className.includes("rounded"))).toBe(
      true,
    );
  });

  it("fetches and lists favorites when signed in", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchFavorites).mockResolvedValue([FAV_A, FAV_B]);

    renderPage();

    await waitFor(() =>
      expect(api.fetchFavorites).toHaveBeenCalledWith("tok"),
    );
    expect(screen.getByText("Rainy Window")).toBeInTheDocument();
    expect(screen.getByText("Midnight Coffee")).toBeInTheDocument();
    // Each row has a "Listen" link to the external URL.
    const links = screen.getAllByRole("link", { name: /listen/i });
    expect(links[0]).toHaveAttribute("href", "https://example.com/a");
    expect(links[1]).toHaveAttribute("href", "https://example.com/b");
  });

  it("shows an empty state when the user has no favorites", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchFavorites).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText(/no favorites yet/i),
    ).toBeInTheDocument();
  });

  it("removes a favorite when the remove button is clicked", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchFavorites).mockResolvedValue([FAV_A, FAV_B]);
    vi.mocked(api.toggleFavorite).mockResolvedValue(false);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Rainy Window");
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() =>
      expect(api.toggleFavorite).toHaveBeenCalledWith(7, "tok"),
    );
    await waitFor(() =>
      expect(screen.queryByText("Rainy Window")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Midnight Coffee")).toBeInTheDocument();
  });

  it("shows an error state when fetching fails", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    const { ApiError } = await import("../lib/api");
    vi.mocked(api.fetchFavorites).mockRejectedValue(
      new ApiError("Server's taking a break.", 500, "boom"),
    );

    renderPage();
    expect(
      await screen.findByText(/server's taking a break/i),
    ).toBeInTheDocument();
  });
});

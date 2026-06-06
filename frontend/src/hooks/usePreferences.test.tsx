import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { usePreferences } from "./usePreferences";

const { getToken, auth } = vi.hoisted(() => ({
  getToken: vi.fn(async () => null as string | null),
  auth: { isSignedIn: false as boolean },
}));

vi.mock("../auth", () => ({
  useAuth: () => ({ isSignedIn: auth.isSignedIn, getToken }),
}));

vi.mock("../lib/api", () => ({
  fetchPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  ApiError: class extends Error {},
}));

import * as api from "../lib/api";

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = false;
  getToken.mockImplementation(async () => null);
});

describe("usePreferences", () => {
  it("returns null preferences when signed out", () => {
    const { result } = renderHook(() => usePreferences());
    expect(result.current.preferences).toBeNull();
    expect(result.current.hasPreferences).toBe(false);
  });

  it("loads preferences from the backend on mount when signed in", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchPreferences).mockResolvedValue({
      preferredGenres: ["lofi"],
      preferredMoods: ["calm"],
    });

    const { result } = renderHook(() => usePreferences());
    await waitFor(() =>
      expect(api.fetchPreferences).toHaveBeenCalledWith("tok"),
    );
    await waitFor(() => expect(result.current.hasPreferences).toBe(true));
    expect(result.current.preferences?.preferredGenres).toEqual(["lofi"]);
  });

  it("reports hasPreferences=false when both lists are empty", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchPreferences).mockResolvedValue({
      preferredGenres: [],
      preferredMoods: [],
    });

    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.preferences).not.toBeNull());
    expect(result.current.hasPreferences).toBe(false);
  });

  it("save() persists and updates local state", async () => {
    auth.isSignedIn = true;
    getToken.mockImplementation(async () => "tok");
    vi.mocked(api.fetchPreferences).mockResolvedValue({
      preferredGenres: [],
      preferredMoods: [],
    });
    vi.mocked(api.updatePreferences).mockResolvedValue({
      preferredGenres: ["jazz"],
      preferredMoods: ["calm"],
    });

    const { result } = renderHook(() => usePreferences());
    await waitFor(() => expect(result.current.preferences).not.toBeNull());

    await act(async () => {
      await result.current.save({
        preferredGenres: ["jazz"],
        preferredMoods: ["calm"],
      });
    });

    expect(api.updatePreferences).toHaveBeenCalledWith("tok", {
      preferredGenres: ["jazz"],
      preferredMoods: ["calm"],
    });
    expect(result.current.hasPreferences).toBe(true);
  });
});

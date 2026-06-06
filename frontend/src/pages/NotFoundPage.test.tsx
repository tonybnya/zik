/**
 * Phase 9 — NotFoundPage. Renders a retro cassette "broken tape" 404, with a
 * Rewind Home button that calls navigate('/'). Uses MemoryRouter so we can
 * drive the route + the back navigation from the test.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { NotFoundPage } from "./NotFoundPage";

// Stable auth mock (same pattern as usePlayer/LandingPage tests).
const { getToken, auth } = vi.hoisted(() => ({
  getToken: vi.fn(async () => null as string | null),
  auth: { isSignedIn: false as boolean },
}));

vi.mock("../auth", () => ({
  useAuth: () => ({
    isSignedIn: auth.isSignedIn,
    getToken,
    openSignIn: () => {},
    openSignUp: () => {},
    closeAuth: () => {},
    signOut: async () => {},
    user: null,
    isLoaded: true,
    isConfigured: false,
    authView: null,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = false;
  getToken.mockImplementation(async () => null);
});

function renderNotFound(initialEntry = "/some-bogus-route") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NotFoundPage", () => {
  it("shows the 404 code, the track name, and the rewind home button", () => {
    renderNotFound();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/track not found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rewind home/i }),
    ).toBeInTheDocument();
  });

  it("includes the cassette-tape metaphor in the body copy", () => {
    renderNotFound();
    expect(screen.getByText(/tape/i)).toBeInTheDocument();
  });

  it("clicking Rewind Home navigates to /", async () => {
    const user = userEvent.setup();
    renderNotFound();

    await user.click(screen.getByRole("button", { name: /rewind home/i }));
    expect(await screen.findByText("HOME")).toBeInTheDocument();
  });
});
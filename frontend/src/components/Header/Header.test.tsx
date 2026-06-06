import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { Header } from "./Header";
import { AuthContext } from "../../auth";
import type { AuthContextValue } from "../../types/auth";

const mockAuth = (over: Partial<AuthContextValue>): AuthContextValue => ({
  isLoaded: true,
  isConfigured: true,
  isSignedIn: false,
  user: null,
  getToken: async () => null,
  signOut: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
  closeAuth: () => {},
  authView: null,
  ...over,
});

const renderWith = (value: AuthContextValue, props = {}) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <Header {...props} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

describe("Header", () => {
  it("shows the wordmark, Favorites, and a Sign in button when signed out", () => {
    renderWith(mockAuth({ isSignedIn: false }));
    expect(screen.getByText("ZIK")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /favorites/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("opens sign-in when the Sign in button is clicked", async () => {
    const openSignIn = vi.fn();
    const user = userEvent.setup();
    renderWith(mockAuth({ isSignedIn: false, openSignIn }));
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(openSignIn).toHaveBeenCalledOnce();
  });

  it("shows the user's name when signed in", () => {
    renderWith(
      mockAuth({
        isSignedIn: true,
        user: { id: "u1", email: "a@b.co", fullName: "Ada L", imageUrl: null },
      }),
    );
    expect(screen.getByText("Ada L")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^sign in$/i })).not.toBeInTheDocument();
  });
});

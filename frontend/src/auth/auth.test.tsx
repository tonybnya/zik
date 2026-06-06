import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "./AuthProvider";
import { AuthContext } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "./useAuth";
import type { AuthContextValue } from "../types/auth";

/**
 * Tests run with no VITE_CLERK_PUBLISHABLE_KEY set, so <AuthProvider> mounts in
 * auth-disabled mode. That lets us verify the gating + abstraction without
 * standing up Clerk. ProtectedRoute is tested against a mock context so we can
 * drive the signed-in branch directly.
 */

function AuthProbe({ onReady }: { onReady: (a: AuthContextValue) => void }) {
  const auth = useAuth();
  onReady(auth);
  return (
    <div>
      <span data-testid="configured">{String(auth.isConfigured)}</span>
      <span data-testid="signed">{String(auth.isSignedIn)}</span>
      <span data-testid="loaded">{String(auth.isLoaded)}</span>
      <button type="button" onClick={auth.openSignIn}>
        open-modal
      </button>
    </div>
  );
}

const mockAuth = (overrides: Partial<AuthContextValue>): AuthContextValue => ({
  isLoaded: true,
  isConfigured: true,
  isSignedIn: true,
  user: null,
  getToken: async () => null,
  signOut: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
  closeAuth: () => {},
  authView: null,
  ...overrides,
});

describe("useAuth", () => {
  it("throws when used outside an <AuthProvider>", () => {
    function Orphan() {
      useAuth();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/within an <AuthProvider>/);
  });
});

describe("AuthProvider (auth-disabled mode)", () => {
  it("provides a signed-out, unconfigured, loaded context", () => {
    render(
      <AuthProvider>
        <AuthProbe onReady={() => {}} />
      </AuthProvider>,
    );
    expect(screen.getByTestId("configured")).toHaveTextContent("false");
    expect(screen.getByTestId("signed")).toHaveTextContent("false");
    expect(screen.getByTestId("loaded")).toHaveTextContent("true");
  });

  it("getToken resolves to null and signOut is a no-op", async () => {
    let captured: AuthContextValue | null = null;
    render(
      <AuthProvider>
        <AuthProbe onReady={(a) => (captured = a)} />
      </AuthProvider>,
    );
    expect(captured).not.toBeNull();
    await expect(captured!.getToken()).resolves.toBeNull();
    await expect(captured!.signOut()).resolves.toBeUndefined();
  });

  it("shows the setup notice when the modal opens without a Clerk key", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthProbe onReady={() => {}} />
      </AuthProvider>,
    );
    await user.click(screen.getByText("open-modal"));
    expect(
      await screen.findByText(/auth is not configured/i),
    ).toBeInTheDocument();
    expect(screen.getByText("VITE_CLERK_PUBLISHABLE_KEY")).toBeInTheDocument();
  });
});

describe("ProtectedRoute", () => {
  it("renders children when signed in", () => {
    render(
      <AuthContext.Provider value={mockAuth({ isSignedIn: true })}>
        <ProtectedRoute>
          <div>secret content</div>
        </ProtectedRoute>
      </AuthContext.Provider>,
    );
    expect(screen.getByText("secret content")).toBeInTheDocument();
  });

  it("renders the fallback when signed out", () => {
    render(
      <AuthContext.Provider value={mockAuth({ isSignedIn: false })}>
        <ProtectedRoute fallback={<div>please sign in</div>}>
          <div>secret content</div>
        </ProtectedRoute>
      </AuthContext.Provider>,
    );
    expect(screen.getByText("please sign in")).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("renders the loading slot until auth resolves", () => {
    render(
      <AuthContext.Provider
        value={mockAuth({ isLoaded: false, isSignedIn: false })}
      >
        <ProtectedRoute loading={<div>loading auth</div>}>
          <div>secret content</div>
        </ProtectedRoute>
      </AuthContext.Provider>,
    );
    expect(screen.getByText("loading auth")).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });
});

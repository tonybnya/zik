import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Rendered while Clerk resolves its initial state. */
  loading?: ReactNode;
  /**
   * Rendered when the user is signed out. Defaults to a prompt that opens the
   * sign-in modal. Pass `promptSignIn` to auto-open the modal on mount.
   */
  fallback?: ReactNode;
  /** Auto-open the sign-in modal when an unauthenticated user lands here. */
  promptSignIn?: boolean;
}

/**
 * Gates content behind authentication (Task 5.6). Works today as a component
 * wrapper; once React Router lands (Phase 12) it can wrap a route element
 * unchanged. While auth is loading it shows `loading`; signed-out users see
 * `fallback` (and optionally get the sign-in modal opened for them).
 */
export function ProtectedRoute({
  children,
  loading,
  fallback,
  promptSignIn = false,
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, openSignIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn && promptSignIn) {
      openSignIn();
    }
  }, [isLoaded, isSignedIn, promptSignIn, openSignIn]);

  if (!isLoaded) {
    return <>{loading ?? null}</>;
  }

  if (!isSignedIn) {
    return <>{fallback ?? <DefaultSignedOut />}</>;
  }

  return <>{children}</>;
}

function DefaultSignedOut() {
  const { openSignIn } = useAuth();
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="text-body-md text-ink-soft">Sign in to continue.</p>
      <button type="button" className="btn-primary" onClick={openSignIn}>
        Sign in
      </button>
    </div>
  );
}

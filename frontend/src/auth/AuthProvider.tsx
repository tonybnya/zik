import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ClerkProvider,
  useUser,
  useAuth as useClerkAuth,
} from "@clerk/clerk-react";

import { AuthContext } from "./AuthContext";
import { AuthModal } from "./AuthModal";
import {
  CLERK_PUBLISHABLE_KEY,
  IS_CLERK_CONFIGURED,
  ZIK_CLERK_APPEARANCE,
} from "../lib/clerk";
import type { AuthContextValue, AuthView } from "../types/auth";

/** The shared modal-control slice, identical across both auth modes. */
interface ModalControls {
  authView: AuthView | null;
  openSignIn: () => void;
  openSignUp: () => void;
  closeAuth: () => void;
}

/**
 * Top-level auth provider (Task 5.2 + 5.5). Gates Clerk behind the publishable
 * key: when present it mounts `<ClerkProvider>` and bridges Clerk state into
 * the ZIK auth context; when absent it provides an auth-disabled context so the
 * rest of the app still renders.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authView, setAuthView] = useState<AuthView | null>(null);

  const modal = useMemo<ModalControls>(
    () => ({
      authView,
      openSignIn: () => setAuthView("sign-in"),
      openSignUp: () => setAuthView("sign-up"),
      closeAuth: () => setAuthView(null),
    }),
    [authView],
  );

  if (IS_CLERK_CONFIGURED) {
    return (
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={ZIK_CLERK_APPEARANCE}
      >
        <ClerkAuthBridge modal={modal}>{children}</ClerkAuthBridge>
      </ClerkProvider>
    );
  }

  return <DisabledAuthBridge modal={modal}>{children}</DisabledAuthBridge>;
}

/** Bridges live Clerk state into the ZIK auth context. */
function ClerkAuthBridge({
  modal,
  children,
}: {
  modal: ModalControls;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, signOut } = useClerkAuth();

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isConfigured: true,
      isSignedIn: Boolean(isSignedIn),
      user: user
        ? {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            fullName: user.fullName,
            imageUrl: user.imageUrl,
          }
        : null,
      getToken: () => getToken(),
      signOut: () => signOut(),
      ...modal,
    }),
    [isLoaded, isSignedIn, user, getToken, signOut, modal],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal />
    </AuthContext.Provider>
  );
}

/** Provides a signed-in stub context when no Clerk key is set.
 *  The backend's AUTH_MODE=stub reads X-Stub-User-Id / X-Stub-User-Email
 *  headers, so we inject them in authHeaders() via getToken(). */
function DisabledAuthBridge({
  modal,
  children,
}: {
  modal: ModalControls;
  children: ReactNode;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded: true,
      isConfigured: false,
      isSignedIn: true,
      user: {
        id: "dev-user",
        email: "dev@zik.app",
        fullName: "Dev User",
        imageUrl: null,
      },
      getToken: async () => "dev-user|dev@zik.app",
      signOut: async () => {},
      ...modal,
    }),
    [modal],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal />
    </AuthContext.Provider>
  );
}

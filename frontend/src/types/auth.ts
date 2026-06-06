/**
 * Shared auth types for the ZIK frontend.
 */

/** The normalized, ZIK-shaped current user (subset of Clerk's user object). */
export interface ZikUser {
  id: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
}

/** Which view the auth modal is showing, or `null` when closed. */
export type AuthView = "sign-in" | "sign-up";

/**
 * The single auth API the app consumes via `useAuth()`. Works identically
 * whether Clerk is configured or running in auth-disabled mode.
 */
export interface AuthContextValue {
  /** True once Clerk has resolved its initial state (always true when disabled). */
  isLoaded: boolean;
  /** True when a Clerk publishable key is present. */
  isConfigured: boolean;
  /** True when a user is signed in. */
  isSignedIn: boolean;
  /** The current user, or `null` when signed out / disabled. */
  user: ZikUser | null;
  /** Fetch a backend JWT for authenticated API calls. `null` when unavailable. */
  getToken: () => Promise<string | null>;
  /** Sign the current user out. */
  signOut: () => Promise<void>;
  /** Open the auth modal on the sign-in view. */
  openSignIn: () => void;
  /** Open the auth modal on the sign-up view. */
  openSignUp: () => void;
  /** Close the auth modal. */
  closeAuth: () => void;
  /** The current modal view, or `null` when closed. */
  authView: AuthView | null;
}

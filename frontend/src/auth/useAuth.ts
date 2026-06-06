import { useContext } from "react";

import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "../types/auth";

/**
 * Access the ZIK auth API. Must be called inside an `<AuthProvider>`.
 *
 * This is the project's single auth abstraction (Task 5.3): it wraps Clerk's
 * `useUser` / `useAuth` so components never import Clerk directly and the app
 * behaves the same in auth-disabled mode.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}

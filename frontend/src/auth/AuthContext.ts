import { createContext } from "react";

import type { AuthContextValue } from "../types/auth";

/**
 * Holds the ZIK auth API. `null` until an `<AuthProvider>` mounts, which lets
 * `useAuth()` detect and reject usage outside the provider.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

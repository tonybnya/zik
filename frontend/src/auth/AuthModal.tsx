import { AnimatePresence, motion } from "motion/react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { useAuth } from "./useAuth";
import { ZIK_CLERK_APPEARANCE } from "../lib/clerk";

/**
 * The ZIK-styled auth modal. Renders Clerk's `<SignIn>` / `<SignUp>` inside a
 * design-system shell with a sign-in / sign-up toggle. When Clerk is not
 * configured it shows a clear setup notice instead of crashing.
 */
export function AuthModal() {
  const { authView, isConfigured, closeAuth, openSignIn, openSignUp } =
    useAuth();

  const isOpen = authView !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-label={authView === "sign-up" ? "Sign up" : "Sign in"}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={closeAuth}
            className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-sm"
          />

          <motion.div
            className="surface-shell relative z-10 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openSignIn}
                    className={
                      authView === "sign-in"
                        ? "label-caps text-ink"
                        : "label-caps text-ink-soft"
                    }
                  >
                    Sign in
                  </button>
                  <span className="label-caps text-ink-soft">/</span>
                  <button
                    type="button"
                    onClick={openSignUp}
                    className={
                      authView === "sign-up"
                        ? "label-caps text-ink"
                        : "label-caps text-ink-soft"
                    }
                  >
                    Sign up
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeAuth}
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={20}
                    strokeWidth={1.5}
                  />
                </button>
              </div>

              {!isConfigured ? (
                <p className="text-body-md text-ink-soft normal-case tracking-normal">
                  Auth is not configured. Set{" "}
                  <code className="text-ink">VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
                  <code className="text-ink">frontend/.env.local</code> to enable
                  sign in.
                </p>
              ) : authView === "sign-up" ? (
                <SignUp routing="virtual" appearance={ZIK_CLERK_APPEARANCE} />
              ) : (
                <SignIn routing="virtual" appearance={ZIK_CLERK_APPEARANCE} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

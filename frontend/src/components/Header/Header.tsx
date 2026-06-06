import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";

import { useAuth } from "../../auth";

interface HeaderProps {
  /** Open the favorites view (Phase 11). */
  onOpenFavorites?: () => void;
}

/**
 * Top app bar (Task 8.4): logo + wordmark, a Favorites link, and auth controls
 * consistent with the design system.
 */
export function Header({ onOpenFavorites }: HeaderProps) {
  const { isSignedIn, user, signOut, openSignIn } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 sm:px-6">
      <Link to="/" className="flex items-center gap-2" aria-label="ZIK home">
        <img src="/logo.png" alt="" className="size-8" />
        <span className="label-caps text-ink">ZIK</span>
      </Link>

      <nav className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost gap-1.5 px-3 py-2"
          onClick={onOpenFavorites}
        >
          <HugeiconsIcon icon={FavouriteIcon} size={16} strokeWidth={1.8} />
          <span className="hidden sm:inline">Favorites</span>
        </button>

        {isSignedIn ? (
          <button
            type="button"
            className="btn-ghost px-3 py-2"
            onClick={() => signOut()}
          >
            <span className="hidden sm:inline">
              {user?.fullName ?? user?.email ?? "Sign out"}
            </span>
            <span className="sm:hidden">Out</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary px-4 py-2"
            onClick={openSignIn}
          >
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}

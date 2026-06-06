import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";

import { useAuth } from "../../auth";

interface HeaderProps {
  /** Number of saved favorites; drives the count badge (Task 11.5). */
  favoritesCount?: number;
}

/**
 * Top app bar (Task 8.4 + 11.5): logo + wordmark, a Favorites link with an
 * optional count badge, and auth controls consistent with the design system.
 */
export function Header({ favoritesCount = 0 }: HeaderProps) {
  const { isSignedIn, user, signOut, openSignIn } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 sm:px-6">
      <Link to="/" className="flex items-center gap-2" aria-label="ZIK home">
        <img src="/logo.png" alt="" className="size-8" />
        <span className="label-caps text-ink">ZIK</span>
      </Link>

      <nav className="flex items-center gap-2">
        <Link
          to="/favorites"
          className="btn-ghost relative gap-1.5 px-3 py-2"
          aria-label={
            favoritesCount > 0
              ? `Favorites, ${favoritesCount} saved`
              : "Favorites"
          }
        >
          <HugeiconsIcon icon={FavouriteIcon} size={16} strokeWidth={1.8} />
          <span className="hidden sm:inline">Favorites</span>
          {favoritesCount > 0 && (
            <span
              data-testid="favorites-badge"
              className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-neutral shadow-[var(--shadow-glow)]"
            >
              {favoritesCount > 99 ? "99+" : favoritesCount}
            </span>
          )}
        </Link>

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

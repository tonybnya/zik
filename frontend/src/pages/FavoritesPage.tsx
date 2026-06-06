import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, FavouriteIcon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";

import { Header } from "../components/Header";
import { useAuth } from "../auth";
import { ApiError, fetchFavorites, toggleFavorite } from "../lib/api";
import type { Song } from "../types/song";

/**
 * Lists the signed-in user's saved songs (Task 11.1). Each row exposes the
 * song's external URL via a "Listen" link and lets the user remove the
 * favorite inline. Signed-out callers are nudged to sign in.
 */
export function FavoritesPage() {
  const { isSignedIn, getToken, openSignIn } = useAuth();
  const reduced = useReducedMotion() ?? false;
  const [favorites, setFavorites] = useState<Song[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const list = await fetchFavorites(token);
        if (!cancelled) setFavorites(list);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : "Couldn't load favorites.";
          setError(message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  const handleRemove = useCallback(
    async (song: Song) => {
      // Optimistic removal.
      setFavorites((prev) =>
        prev ? prev.filter((s) => Number(s.id) !== Number(song.id)) : prev,
      );
      try {
        const token = await getToken();
        await toggleFavorite(Number(song.id), token);
      } catch {
        // Re-fetch the canonical list on failure.
        try {
          const token = await getToken();
          const list = await fetchFavorites(token);
          setFavorites(list);
        } catch {
          // Swallow — list is already shown.
        }
      }
    },
    [getToken],
  );

  if (!isSignedIn) {
    return (
      <>
        <Header favoritesCount={0} />
        <SignedOutState onSignIn={openSignIn} reduced={reduced} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header favoritesCount={0} />
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-2 text-display-md text-ink normal-case tracking-normal">
            Something jammed
          </h1>
          <p role="alert" className="text-body-md text-ink-soft">
            {error}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded border border-line/30 bg-card px-4 py-2 text-body-md text-ink transition hover:bg-line/15"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            Back to the deck
          </Link>
        </div>
      </>
    );
  }

  if (favorites === null) {
    return (
      <>
        <Header favoritesCount={0} />
        <div
          role="status"
          className="mx-auto flex min-h-dvh max-w-2xl items-center justify-center px-6"
        >
          <p className="text-body-md text-ink-soft">Loading your tape…</p>
        </div>
      </>
    );
  }

  if (favorites.length === 0) {
    return (
      <>
        <Header favoritesCount={0} />
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={48}
            className="mb-4 text-ink-soft/40"
          />
          <h1 className="mb-2 text-display-md text-ink normal-case tracking-normal">
            No favorites yet
          </h1>
          <p className="mb-6 text-body-md text-ink-soft">
            Hit the heart on any track and it lands here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 text-body-md text-neutral shadow-[var(--shadow-glow)] transition hover:brightness-110"
          >
            Find a track
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header favoritesCount={favorites.length} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.3 }}
        className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-12"
      >
        <Link
          to="/"
          className="mb-6 inline-flex w-fit items-center gap-2 text-body-sm text-ink-soft transition hover:text-ink"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Back to the deck
        </Link>

        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-display-lg text-ink normal-case tracking-normal">
              Favorites
            </h1>
            <p className="text-body-md text-ink-soft">
              {favorites.length === 1
                ? "1 track saved"
                : `${favorites.length} tracks saved`}
            </p>
          </div>
        </header>

        <ul role="list" className="space-y-2">
          {favorites.map((song) => (
            <FavoriteRow key={song.id} song={song} onRemove={handleRemove} />
          ))}
        </ul>
      </motion.div>
    </>
  );
}

interface FavoriteRowProps {
  song: Song;
  onRemove: (song: Song) => void;
}

function FavoriteRow({ song, onRemove }: FavoriteRowProps) {
  return (
    <li className="group flex items-center gap-3 rounded border border-line/20 bg-card/60 p-3 transition hover:border-line/40 hover:bg-card">
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-md text-ink">{song.title}</p>
        <p className="truncate text-body-sm text-ink-soft">
          {song.artist} · {song.genre}
        </p>
      </div>
      <a
        href={song.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded border border-line/30 px-3 py-1.5 text-body-sm text-ink transition hover:border-accent hover:text-accent"
      >
        <HugeiconsIcon icon={LinkSquare01Icon} size={14} />
        Listen
      </a>
      <button
        type="button"
        onClick={() => onRemove(song)}
        aria-label={`Remove ${song.title} from favorites`}
        className="grid size-8 place-items-center rounded text-ink-soft transition hover:bg-line/15 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        <HugeiconsIcon icon={FavouriteIcon} size={18} className="text-accent" />
      </button>
    </li>
  );
}

function SignedOutState({
  onSignIn,
  reduced,
}: {
  onSignIn: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center"
    >
      <HugeiconsIcon
        icon={FavouriteIcon}
        size={48}
        className="mb-4 text-ink-soft/40"
      />
      <h1 className="mb-2 text-display-md text-ink normal-case tracking-normal">
        Sign in to see your favorites
      </h1>
      <p className="mb-6 text-body-md text-ink-soft">
        Your saved tracks live behind the sign-in door.
      </p>
      <button
        type="button"
        onClick={onSignIn}
        className="rounded border border-accent bg-accent px-4 py-2 text-body-md text-neutral shadow-[var(--shadow-glow)] transition hover:brightness-110"
      >
        Sign in
      </button>
      <Link
        to="/"
        className="mt-4 text-body-sm text-ink-soft transition hover:text-ink"
      >
        Back to the deck
      </Link>
    </motion.div>
  );
}

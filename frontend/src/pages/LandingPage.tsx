import { motion } from "motion/react";

import { CassettePlayer } from "../components/CassettePlayer";
import { BubbleField } from "../components/SongBubble";
import { Header } from "../components/Header";
import { NowPlaying } from "../components/NowPlaying";
import { usePlayer } from "../hooks/usePlayer";

/**
 * The main app page (Phase 8 + 10): the cassette hero with orbiting song
 * bubbles (similar on the inner ring, AI suggestions on the outer ring after
 * 3+ plays), a top app bar, and a Now Playing footer.
 */
export function LandingPage() {
  const {
    song,
    similar,
    aiSuggestions,
    isPlaying,
    isLoading,
    error,
    favoriteIds,
    togglePlay,
    selectSong,
    toggleFavorite,
  } = usePlayer();

  const isFavorite = song ? favoriteIds.has(Number(song.id)) : false;

  return (
    <motion.div
      className="relative min-h-dvh overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Ambient glow behind the cassette (layers over the global texture) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[100px]"
      />

      <Header />

      <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-24">
        <div className="mb-2 flex flex-col items-center gap-1 text-center">
          <h1 className="text-display-lg text-ink">ZIK</h1>
          <p className="text-body-md text-ink-soft">Focus music, on tape</p>
        </div>

        <div className="relative w-full max-w-[560px]">
          <CassettePlayer
            isPlaying={isPlaying}
            onPlayToggle={togglePlay}
            song={song}
            isLoading={isLoading}
          />
          {song && <BubbleField songs={similar} onSelect={selectSong} />}
          {song && aiSuggestions.length > 0 && (
            <BubbleField
              songs={aiSuggestions}
              onSelect={selectSong}
              maxVisible={5}
              ring="outer"
            />
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-line/30 bg-card/80 px-4 py-2 text-body-md text-ink normal-case tracking-normal"
          >
            {error}
          </p>
        )}
      </main>

      <NowPlaying
        song={song}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
    </motion.div>
  );
}

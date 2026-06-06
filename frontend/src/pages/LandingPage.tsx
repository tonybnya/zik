import { useState } from "react";
import { motion } from "motion/react";

import { CassettePlayer } from "../components/CassettePlayer";
import { BubbleField } from "../components/SongBubble";
import { Header } from "../components/Header";
import { NowPlaying } from "../components/NowPlaying";
import { PreferencePrompt } from "../components/PreferencesPanel";
import { usePlayer } from "../hooks/usePlayer";
import { usePreferences } from "../hooks/usePreferences";
import { useAuth } from "../auth";

/** Number of plays before the preference prompt appears (Task 11.4). */
const PROMPT_TRIGGER_PLAYS = 2;

/**
 * The main app page (Phase 8 + 10 + 11): the cassette hero with orbiting song
 * bubbles (similar on the inner ring, AI suggestions on the outer ring after
 * 3+ plays), a top app bar, a Now Playing footer, and a one-time preference
 * nudge that appears after the 2nd play.
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
    playCount,
    togglePlay,
    selectSong,
    toggleFavorite,
  } = usePlayer();

  const { isSignedIn } = useAuth();
  const { preferences, hasPreferences, save } = usePreferences();
  const [promptDismissed, setPromptDismissed] = useState(false);

  const showPrompt =
    isSignedIn &&
    !hasPreferences &&
    !promptDismissed &&
    playCount >= PROMPT_TRIGGER_PLAYS;

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

      <Header favoritesCount={favoriteIds.size} />

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

        <PreferencePrompt
          enabled={showPrompt}
          preferences={preferences}
          onSave={save}
          onDismiss={() => setPromptDismissed(true)}
        />
      </main>

      <NowPlaying
        song={song}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
    </motion.div>
  );
}

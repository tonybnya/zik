import { useState } from "react";

import { useAuth } from "./auth";
import { CassettePlayer } from "./components/CassettePlayer";
import { BubbleField } from "./components/SongBubble";
import type { Song } from "./types/song";

// Placeholder data until Phase 8 wires the real API.
const DEMO_SONG: Song = {
  id: 0,
  title: "Midnight Study Tape",
  artist: "Lo-Fi Collective",
  genre: "lofi",
  moods: ["focus", "calm"],
  bpm: 76,
  externalUrl: "#",
  coverUrl: null,
};

const DEMO_SIMILAR: Song[] = [
  { id: 1, title: "Rainy Window", artist: "Tape Deck", genre: "lofi", moods: ["calm"], bpm: 72, externalUrl: "#", coverUrl: null },
  { id: 2, title: "Paper Planes", artist: "Dusty Keys", genre: "lofi", moods: ["dream"], bpm: 80, externalUrl: "#", coverUrl: null },
  { id: 3, title: "Slow Orbit", artist: "Nimbus", genre: "ambient", moods: ["atmospheric"], bpm: 60, externalUrl: "#", coverUrl: null },
  { id: 4, title: "Late Bus", artist: "Cassette Sun", genre: "jazz", moods: ["mellow"], bpm: 90, externalUrl: "#", coverUrl: null },
  { id: 5, title: "Amber Drift", artist: "Sol Vega", genre: "synthwave", moods: ["nostalgic"], bpm: 100, externalUrl: "#", coverUrl: null },
  { id: 6, title: "Folded Light", artist: "Aurora Theory", genre: "cinematic", moods: ["epic"], bpm: 85, externalUrl: "#", coverUrl: null, isAiPick: true },
];

function App() {
  const { isSignedIn, user, signOut, openSignIn, openSignUp } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [song, setSong] = useState<Song | null>(null);

  const handlePlayToggle = () => {
    if (!song) setSong(DEMO_SONG);
    setIsPlaying((p) => !p);
  };

  const handleSelect = (next: Song) => {
    setSong(next);
    setIsPlaying(true);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 p-6">
      <header className="flex flex-col items-center gap-1">
        <h1 className="text-display-lg text-ink">ZIK</h1>
        <p className="text-body-md text-ink-soft">Focus music, on tape.</p>
      </header>

      <div className="relative w-full max-w-[560px]">
        <CassettePlayer
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          song={song}
        />
        {song && <BubbleField songs={DEMO_SIMILAR} onSelect={handleSelect} />}
      </div>

      {isSignedIn ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-body-md text-ink normal-case tracking-normal">
            Signed in as {user?.fullName ?? user?.email ?? "you"}
          </p>
          <button type="button" className="btn-ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button type="button" className="btn-primary" onClick={openSignIn}>
            Sign in
          </button>
          <button type="button" className="btn-ghost" onClick={openSignUp}>
            Sign up
          </button>
        </div>
      )}
    </main>
  );
}

export default App;

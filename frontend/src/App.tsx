import { useState } from "react";

import { useAuth } from "./auth";
import { CassettePlayer } from "./components/CassettePlayer";
import type { CassetteSong } from "./components/CassettePlayer";

// Placeholder track until Phase 8 wires GET /api/songs/random.
const DEMO_SONG: CassetteSong = {
  title: "Midnight Study Tape",
  artist: "Lo-Fi Collective",
};

function App() {
  const { isSignedIn, user, signOut, openSignIn, openSignUp } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [song, setSong] = useState<CassetteSong | null>(null);

  const handlePlayToggle = () => {
    if (!song) setSong(DEMO_SONG);
    setIsPlaying((p) => !p);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 p-6">
      <header className="flex flex-col items-center gap-1">
        <h1 className="text-display-lg text-ink">ZIK</h1>
        <p className="text-body-md text-ink-soft">Focus music, on tape.</p>
      </header>

      <CassettePlayer
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        song={song}
      />

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

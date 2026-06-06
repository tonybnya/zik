import { useAuth } from "./auth";

function App() {
  const { isLoaded, isSignedIn, user, signOut, openSignIn, openSignUp } =
    useAuth();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-display-lg text-ink">ZIK</h1>
      <p className="text-body-md text-ink-soft">Focus music, on tape.</p>

      {!isLoaded ? (
        <p className="label-caps text-ink-soft">Loading…</p>
      ) : isSignedIn ? (
        <div className="flex flex-col items-center gap-3">
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

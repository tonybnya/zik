# ZIK — Manual Testing Guide

A guided walkthrough of the app at the end of Phase 12. Each section maps to a
phase, tells you the exact inputs to try, and the expected output so you can
pass/fail each behavior.

> **Time budget:** ~30 minutes for the full sweep. Run servers once and
> work through the phases top-to-bottom.

---

## 0. Prerequisites

| Tool       | Version            | Why                              |
|------------|--------------------|----------------------------------|
| Node.js    | 22+                | Vite, Vitest, React 19           |
| `uv`       | latest             | Python package / runtime manager |
| Python     | 3.12+              | Backend                          |
| `git`      | any                | —                                |

No database server is required. ZIK uses local SQLite (`backend/dev.db`) for
dev. The `*.db` glob in `.gitignore` keeps your local DB out of git.

---

## 1. First-time setup

```bash
# from the repo root
cd /home/tonybnya/Work/portfolio/zik

# --- backend ---
cd backend
uv sync                           # installs deps into .venv
uv run python -m app.db_init      # creates dev.db schema
uv run python -m app.seed         # inserts 230 royalty-free tracks
uv run python -m app.seed --count # expect: "Songs in DB: 230"
cd ..

# --- frontend ---
cd frontend
npm install
cd ..
```

**Expected output** of the seed step:
```
Loaded 230 songs from .../backend/app/seeds/songs.json
Songs in DB: 230
```

> If you ever want a clean slate: `rm backend/dev.db` and re-run `db_init` +
> `seed`.

### Optional: enable AI suggestions

The `/api/recommendations` endpoint calls Google Gemini when:

1. The user has **1+ plays** in their history, and
2. `GEMINI_API_KEY` is set in the **backend** environment.

Without the key, recommendations still work — they fall back to your last 5
favorites. To enable real AI suggestions:

```bash
# backend/.env
GEMINI_API_KEY=AIza...your-key...

# restart the backend after editing .env
```

> **Clerk is NOT required for manual testing.** Without `VITE_CLERK_PUBLISHABLE_KEY`
> in `frontend/.env`, the app runs in "auth-disabled" mode: always signed out
> on the frontend, but the backend still accepts stub auth headers
> (`X-Stub-User-Id` / `X-Stub-User-Email`) so you can exercise the full API
> surface via `curl`. See §6.

---

## 2. Run the servers

Open **two terminals** from the repo root.

**Terminal A — backend (Flask):**

```bash
cd backend
uv run flask --app app.app_factory:create_app run --port 5000 --debug
```

Expected:
```
 * Running on http://127.0.0.1:5000
 * Debugger is active
```

Smoke test in a third terminal:
```bash
curl -s http://127.0.0.1:5000/api/health | python -m json.tool
# → { "status": "ok" }
```

**Terminal B — frontend (Vite):**

```bash
cd frontend
npm run dev
```

Expected:
```
  VITE v8.x  ready in 412 ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173/** in your browser. You should see:

- The ZIK header (logo + "Favorites" link + "Sign in" button)
- A drifting cassette tape ("ZIK", "Focus music, on tape")
- An ambient amber glow behind the cassette
- 5–8 song bubbles orbiting the cassette (after you press Play)

If both of those render, **Phase 0 is green** ✓.

---

## 3. Phase-by-phase test plan

### Phase 0 — Design system & shell

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `http://localhost:5173/` | Amber-on-charcoal theme, JetBrains Mono, drifting cassette |
| 2 | Resize the window from 320px → 1600px | Cassette scales fluidly; bubbles stay inside the viewport |
| 3 | Toggle DevTools → Rendering → "Emulate CSS media feature: prefers-reduced-motion" | Cassette stops drifting; reels freeze; bubbles stop animating |

**Pass criteria:** no horizontal scroll on mobile width, no overflow at desktop
width, reduced-motion preference is honored.

### Phase 1 — Header + auth scaffolding

| Step | Action | Expected |
|------|--------|----------|
| 1 | Land on `/` | Header shows "ZIK" logo, "Favorites" link, "Sign in" button |
| 2 | Click "Sign in" | AuthModal opens (since Clerk is not configured, this is the inert sign-in view) |
| 3 | Click the X / backdrop | Modal closes |

**Pass criteria:** clicking outside the modal or pressing ESC closes it. No
console errors.

### Phase 2 — Database & models (backend)

Run these from the repo root:

```bash
cd backend
uv run python -c "
from app.app_factory import create_app
from app.extensions import db
from app.models import Song, User, Favorite, PlayHistory, Preference
app = create_app()
with app.app_context():
    print('songs:', db.session.query(Song).count())           # 230
    print('users:', db.session.query(User).count())           # 0
    print('favorites:', db.session.query(Favorite).count())   # 0
    print('history:', db.session.query(PlayHistory).count())  # 0
    print('prefs:', db.session.query(Preference).count())    # 0
"
```

**Pass criteria:** counts match (230 songs, 0 everything else on a fresh DB).

### Phase 3 — Public song API (no auth)

```bash
# Random song (200, valid song object)
curl -s http://127.0.0.1:5000/api/songs/random | python -m json.tool

# Similar songs to id=1 (up to 8, by genre/mood)
curl -s http://127.0.0.1:5000/api/songs/1/similar | python -m json.tool

# 404 for unknown song
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/songs/9999/similar
# → 404

# 404 for empty library (only if you wipe dev.db)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/songs/random
# → 404 with code "library_empty"
```

**Pass criteria:** 200/404 codes match, every response includes `id`, `title`,
`artist`, `genre`, `moods`, `external_url`.

### Phase 4 — Playback flow (no auth needed)

In the browser:

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click the cassette play button | A random song loads, the label shows title/artist, bubbles appear orbiting |
| 2 | Click a bubble | The cassette flips to that song, new similar bubbles appear |
| 3 | Click play again | The cassette pauses/resumes; reels stop/start spinning |
| 4 | Click the "Listen" link in the NowPlaying footer | Opens `external_url` in a new tab |

**Pass criteria:** each click triggers a fresh `fetchRandomSong` or
`fetchSimilarSongs` request visible in the Network panel.

### Phase 5 — Auth surface

Without Clerk keys, the app stays in "signed out" mode. Clicking the heart
icon should open the sign-in modal (no actual sign-in happens). To test the
*real* auth-gated flows, see §6 (backend stub auth via curl) — the
favorites/preferences/history/recommendations endpoints all work end-to-end
once you provide stub headers.

### Phase 6 — Cassette player

| Step | Action | Expected |
|------|--------|----------|
| 1 | Hover the play button | Subtle scale-up (1.06x) |
| 2 | Press play | Reels spin, cassette floats gently, button label flips to "Pause" |
| 3 | Press pause | Reels stop, cassette settles, button label flips back to "Play" |
| 4 | Click play with no song loaded | Loading spinner appears on the button |
| 5 | Turn on reduced-motion (DevTools) | All motion short-circuits to zero — no float, no reel spin |

**Pass criteria:** visual states match actions, no layout shift on hover/press.

### Phase 7 — Song bubbles

| Step | Action | Expected |
|------|--------|----------|
| 1 | Press play once | Up to 8 song bubbles appear in an orbit, evenly distributed with a per-song jitter |
| 2 | Click a bubble | That song swaps in; the new orbit is deterministic (same bubble keeps its slot relative to the cassette) |
| 3 | Hover a bubble | The bubble scales up; cursor changes to pointer |
| 4 | Wait ~10 seconds | A new bubble may enter the field when a new similar song is loaded — `AnimatePresence` flies it in |

**Pass criteria:** the orbit stays around the cassette, no bubble escapes the
viewport, the deterministic slot pattern is consistent across rerenders of
the same song.

### Phase 8 — Landing page composition

| Step | Action | Expected |
|------|--------|----------|
| 1 | Visit `/` | Cassette + bubbles + NowPlaying footer + header all visible together |
| 2 | Trigger an error (stop the backend, click play) | Inline error message appears below the cassette |
| 3 | Restart the backend, click play | Error clears, new song loads |
| 4 | Press `Cmd/Ctrl + R` | The page fades back in (entry animation) |

**Pass criteria:** all four regions render together, the error path is
non-blocking, no console errors.

### Phase 9 — 404 page

| Step | Action | Expected |
|------|--------|----------|
| 1 | Visit `http://localhost:5173/this-does-not-exist` | "The tape has snapped" page appears with broken-tape SVG |
| 2 | Click "Rewind Home" | Navigates to `/` |
| 3 | Click the ZIK logo in the header | Same — SPA navigation, no full page reload |
| 4 | Open the same 404 URL in a new tab | Same 404 page renders (server fallback not needed in dev) |

**Pass criteria:** navigation is SPA-style (no white flash), 404 has a
working back-to-home affordance.

### Phase 10 — AI recommendations (requires 3 plays + auth)

**Without `GEMINI_API_KEY`** the endpoint still works (favorites fallback).
**Without being signed in** the recommendations flow doesn't run — see §6 for
how to drive this via stub auth.

If you want to drive the UI as a signed-in user, the simplest path is to
temporarily flip `isSignedIn` in `frontend/src/auth/AuthProvider.tsx` (search
for `isSignedIn: false` in the `DisabledAuthBridge` and change it to `true`
plus add a `user` object). With that, the AI flow becomes observable end-to-end
in the UI.

Once you have a signed-in state (UI or stub), the test is:

| Step | Action | Expected |
|------|--------|----------|
| 1 | First play (cassette or bubble) | No outer ring yet |
| 2 | Second play | Still no outer ring |
| 3 | Third play | An outer ring of up to 5 "AI pick" bubbles appears (warm-amber border) |
| 4 | Click an AI bubble | The song swaps in (these are real songs from the library, cross-referenced against the Gemini response) |
| 5 | Check Network tab | One `GET /api/recommendations` call after the 3rd play; no further calls on additional plays |

**Pass criteria:** the outer ring only appears after 3 plays, the
recommendations call fires exactly once per session, the bubble count
matches the response.

### Phase 11 — Favorites + preferences (auth required)

UI behavior (signed-out user):
- Click the heart on the NowPlaying footer → AuthModal opens (no save)
- Visit `/favorites` → "Sign in to see your favorites" CTA

For the full signed-in experience, use the §6 stub-auth dance, OR add a
temporary `isSignedIn: true` to `DisabledAuthBridge` (see Phase 10 tip).

**Signed-in test plan:**

| Step | Action | Expected |
|------|--------|----------|
| 1 | Press play, then click the heart on the footer | The heart fills, the favorites badge in the header increments to `1` |
| 2 | Play 1 more song, favorite it | Badge shows `2` |
| 3 | Click the "Favorites" link in the header | Routes to `/favorites`, lists 2 songs, each with a "Listen" link |
| 4 | On `/favorites`, click the heart on a row | The row disappears, badge drops to `1` |
| 5 | Press play 1 time (signed in, no prefs yet) | No prompt |
| 6 | Press play a 2nd time | A "Want a tape that knows your taste? Pick / X" banner appears below the cassette |
| 7 | Click "Pick" | PreferencesPanel modal opens, 7 genres + 19 moods as toggleable chips |
| 8 | Toggle "jazz" + "calm", click Save | Banner disappears. Subsequent `/api/songs/N/similar` calls now bias jazz/calm candidates to the top |
| 9 | Close the panel by pressing ESC | Modal closes, no save |
| 10 | Click the X on the banner | Banner hides for this session, doesn't come back |

**Pass criteria:** the badge count tracks the actual favorite count, removing
from the list page updates the badge live, preferences are persisted (visit
`/api/preferences` via curl to confirm).

### Phase 12 — Routing & app shell

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate `/` → `/favorites` → `/` repeatedly | Each transition fades the old page out before the new one fades in (~180ms) |
| 2 | Throttle network to "Slow 3G" in DevTools, navigate to `/favorites` for the first time | A `PageSkeleton` (pulsing ring + bars) appears for ~1 frame, then the page |
| 3 | Open Network → JS, check chunk sizes | `LandingPage`, `FavoritesPage`, `NotFoundPage` ship as separate chunks (≤20KB each) |
| 4 | Turn on reduced-motion | Page transitions short-circuit to zero duration |

**Pass criteria:** exit animations finish before enter animations start
(`mode="wait"`), Suspense fallback only shows for actual async resolution
(not on cached chunks), the main bundle is noticeably smaller than the sum
of all pages.

---

## 4. Backend-only test sweep (no frontend)

Useful for CI, smoke-testing the API in isolation, or testing the signed-in
flows without Clerk.

```bash
# Use stub auth headers — these tell the backend "I am user X"
HDR1='-H "X-Stub-User-Id: clerk_test_123" -H "X-Stub-User-Email: tester@zik.app"'

# Play history
curl -s -X POST http://127.0.0.1:5000/api/history \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" \
  -H "Content-Type: application/json" \
  -d '{"song_id": 1}'
# → 201 Created

curl -s http://127.0.0.1:5000/api/history \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" | python -m json.tool
# → { "entries": [ { "song_id": 1, "song_title": "...", "played_at": "..." } ] }

# Favorites
curl -s -X POST http://127.0.0.1:5000/api/favorites \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" \
  -H "Content-Type: application/json" \
  -d '{"song_id": 1}'
# → { "favorited": true, "song_id": 1 }

curl -s http://127.0.0.1:5000/api/favorites \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" | python -m json.tool
# → { "songs": [ { "id": 1, "title": "...", ... } ] }

# Toggle off
curl -s -X POST http://127.0.0.1:5000/api/favorites \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" \
  -H "Content-Type: application/json" \
  -d '{"song_id": 1}'
# → { "favorited": false, "song_id": 1 }

# Preferences — get (auto-creates empty record)
curl -s http://127.0.0.1:5000/api/preferences \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" | python -m json.tool
# → { "preferred_genres": [], "preferred_moods": [], "updated_at": null }

# Preferences — set
curl -s -X PUT http://127.0.0.1:5000/api/preferences \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" \
  -H "Content-Type: application/json" \
  -d '{"preferred_genres": ["lofi", "jazz"], "preferred_moods": ["calm"]}' | python -m json.tool

# Recommendations (with 0 plays, returns favorites fallback)
curl -s http://127.0.0.1:5000/api/recommendations \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" | python -m json.tool
# → { "songs": [...], "ai_powered": false, "source": "favorites_fallback" }

# Recommendations (with 1+ plays + GEMINI_API_KEY)
# → { "songs": [...], "ai_powered": true, "source": "gemini" }

# Similar-songs preference boost (Task 11.3 backend)
curl -s http://127.0.0.1:5000/api/songs/1/similar \
  -H "X-Stub-User-Id: clerk_test_123" \
  -H "X-Stub-User-Email: tester@zik.app" | python -m json.tool
# → candidates matching the user's preferred_genres/preferred_moods are
#   ranked above base matches

# Auth missing → 401
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/favorites
# → 401
```

---

## 5. Testing the signed-in UI flows without Clerk

The cleanest way to drive the favorites / preferences / AI flows in the UI
without wiring up a real Clerk account is to flip the auth state for local
exploration.

Open `frontend/src/auth/AuthProvider.tsx` and find the
`DisabledAuthBridge` block (around line 110). Temporarily change:

```tsx
isSignedIn: false,
user: null,
```

to:

```tsx
isSignedIn: true,
user: {
  id: "clerk_test_123",
  email: "tester@zik.app",
  fullName: "Tester",
  imageUrl: null,
},
getToken: async () => "stub-token",   // the backend ignores this in stub mode
```

Save; Vite HMR reloads. Now:

- The "Sign in" button in the header is replaced with "Tester"
- Clicking the heart on the NowPlaying footer fires a real `POST /api/favorites`
  with the stub headers
- The 2nd-play preference prompt appears
- After 3 plays, the AI suggestions outer ring fires

**Important:** revert this change before committing. It's a dev affordance,
not production code.

---

## 6. Reduced-motion + accessibility smoke

Quick a11y pass to catch obvious issues before Phase 13's formal audit:

| Check | How | Expected |
|-------|-----|----------|
| Tab order | Press Tab from the address bar | Focus moves through: header logo → Favorites link → Sign in / user name → cassette play button → each bubble (in orbit order) |
| Focus ring | Tab to the play button | Visible 2px amber ring (`focus-visible:outline-2 focus-visible:outline-accent`) |
| Reduced motion | DevTools → Rendering → "prefers-reduced-motion" | Cassette drift, reel spin, bubble orbit, page transitions all stop |
| Screen reader | VoiceOver (mac) or NVDA (win), navigate to `/` | Header announces "ZIK home, link"; play button announces "Play, button" |
| Color contrast | DevTools → Inspect any text element → check | Body text passes WCAG AA against the card background |

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Module not found '@clerk/clerk-react'` on first run | Vite hasn't installed deps | `cd frontend && npm install` |
| Frontend starts but `fetchRandomSong` 500s | Backend not running, or CORS origin mismatch | Confirm backend is on `:5000`; check `CORS_ORIGINS` in backend env |
| `library_empty` from `/api/songs/random` | You wiped the DB without re-seeding | `cd backend && uv run python -m app.seed` |
| Recommendations always return `favorites_fallback` | No `GEMINI_API_KEY`, or zero plays, or zero favorites | Add a key, log a few plays, or favorite a few tracks |
| 404 page shows raw React error | BrowserRouter serving from a deep link | Use Vite's dev server (handles SPA fallback) not a static file server |
| 3rd play doesn't trigger AI suggestions | Strict-mode double-fire guard tripped, or the page reloaded | Reload the page, play 3 more songs |
| Header badge shows 0 even with favorites | usePlayer's signed-in favorites set didn't populate | Confirm Clerk is configured, or that you applied the §5 patch |

---

## 8. Cleanup

```bash
# Wipe and reseed the DB
cd backend
rm dev.db
uv run python -m app.db_init
uv run python -m app.seed

# Stop the servers with Ctrl+C in each terminal
# Re-run the test suite if you want a clean baseline
cd backend && uv run pytest -q       # 116 tests
cd ../frontend && npm test -- --run  # 83 tests
```

---

## 9. What's NOT in scope yet

Per `TASKS.md`, the following phases still need work:

- **Phase 13 (Polish & QA)** — Lighthouse audit, full keyboard a11y, cross-browser
  smoke, mobile layout QA, full Clerk end-to-end test
- **Phase 14 (Deploy)** — Vercel + Supabase config, real Clerk JWKS verification,
  Alembic migrations, environment wiring

This guide only covers phases 0–12. Don't expect to see those yet.

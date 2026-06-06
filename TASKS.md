# ZIK – Implementation Task List

> Ordered by dependency. Complete phases sequentially; tasks within a phase can be parallelized where noted.

---

## Phase 0 — Project Bootstrap

- [x] **0.1** Initialize monorepo structure: `/frontend` and `/backend` folders at root
- [x] **0.2** Set up `frontend/` with Vite + React + TypeScript (`npm create vite@latest`)
- [x] **0.3** Install and configure Tailwind v4 in frontend
- [x] **0.4** Install HugeIcons, Framer Motion in frontend
- [x] **0.5** Set up `backend/` with `uv` — create `pyproject.toml`, install Flask, SQLAlchemy, Flask-CORS, python-dotenv
- [x] **0.6** Configure `ruff` and `ty` for linting and type checking in backend
- [x] **0.7** Create root `.env.example` and `.gitignore`
- [x] **0.8** Initialize Git repository, make initial commit

---

## Phase 1 — Design System & Assets

- [x] **1.1** Read and internalize `DESIGN.md` — extract color tokens, font choices, spacing scale
- [x] **1.2** Configure Tailwind v4 theme with ZIK design tokens (colors, fonts, shadows, border radii)
- [x] **1.3** Place `cassette.png`, `favicon.png`, `logo.png` in `frontend/public/`
- [x] **1.4** Set `favicon.png` as the browser favicon in `index.html`
- [x] **1.5** Create global CSS baseline (resets, custom scrollbar, background texture if needed)
- [x] **1.6** Define reusable Tailwind component classes (`.btn-primary`, `.glass-card`, etc.)

---

## Phase 2 — Backend: Database & Models

- [x] **2.1** Create SQLAlchemy models:
  - `Song` — `id`, `title`, `artist`, `genre`, `moods` (JSON), `bpm`, `external_url`, `cover_url`
  - `User` — `id`, `clerk_id`, `email`, `created_at`
  - `PlayHistory` — `id`, `user_id`, `song_id`, `played_at`
  - `Favorite` — `id`, `user_id`, `song_id`, `saved_at`
  - `Preference` — `id`, `user_id`, `preferred_genres` (JSON), `preferred_moods` (JSON), `updated_at`
- [x] **2.2** Set up SQLAlchemy engine with env-based `DATABASE_URL` (SQLite locally, Supabase Postgres in prod)
- [x] **2.3** Write `db_init.py` — creates all tables on first run
- [x] **2.4** Write database migration strategy note (use Flask-Migrate or manual Alembic for prod)

---

## Phase 3 — Backend: Song Seed Data

- [x] **3.1** Curate song list (150–300 entries) across categories:
  - Lo-fi hip hop (50 songs)
  - Cinematic / Orchestral (40 songs)
  - Ambient / Drone (30 songs)
  - Nature Sounds (20 songs)
  - Jazz instrumental (30 songs)
  - Classical focus (30 songs)
  - Synthwave instrumental (30 songs)
- [x] **3.2** Structure each entry as JSON: `{ title, artist, genre, moods[], bpm, external_url, cover_url }`
- [x] **3.3** Save seed data to `backend/app/seeds/songs.json`
- [x] **3.4** Write `seed.py` script — reads JSON and bulk-inserts into `Song` table
- [x] **3.5** Run seed and verify data in SQLite with a quick query

---

## Phase 4 — Backend: API Routes

- [x] **4.1** Create Flask app factory (`create_app()`) with CORS, env config
- [x] **4.2** `GET /api/songs/random` — returns one random `Song` as JSON
- [x] **4.3** `GET /api/songs/:id/similar` — returns songs sharing mood tags or genre with the given song (exclude self, limit 8)
- [x] **4.4** `POST /api/history` — logs a play event for authenticated user (stub auth; Clerk seam in place for Phase 14)
- [x] **4.5** `POST /api/favorites` — toggles favorite for a song (auth required)
- [x] **4.6** `GET /api/favorites` — returns user's favorited songs (auth required)
- [x] **4.7** `GET /api/preferences` — returns user preference record (auth required)
- [x] **4.8** `PUT /api/preferences` — updates genres/moods preferences (auth required)
- [x] **4.9** `GET /api/recommendations` — Gemini-powered endpoint (auth required; stub returns favorites, real swap in Phase 10)
- [x] **4.10** Write auth middleware (stub for dev via `X-Stub-User-Id`/`X-Stub-User-Email`; Clerk JWT seam wired for Phase 14)
- [x] **4.11** Add error handlers for 400, 401, 404, 500 (centralized in `app/errors.py`)
- [x] **4.12** Test all endpoints with `curl` or Postman

---

## Phase 5 — Frontend: Auth (Clerk)

- [x] **5.1** Install `@clerk/clerk-react`
- [x] **5.2** Wrap app in `<ClerkProvider>` with `VITE_CLERK_PUBLISHABLE_KEY`
- [x] **5.3** Create `useAuth` hook abstraction (wraps Clerk's `useUser`, `useAuth`)
- [x] **5.4** Build `<AuthModal>` component — sign in / sign up using Clerk's `<SignIn>` / `<SignUp>` components, styled to match ZIK design
- [x] **5.5** Add auth state to a global context or Zustand store
- [x] **5.6** Create `ProtectedRoute` wrapper for pages requiring auth

---

## Phase 6 — Frontend: Cassette Player Component

> This is the core visual centerpiece. Take time here.

- [x] **6.1** Sketch component tree:
  ```
  <CassettePlayer>
    <CassetteBody>
      <TapeReel side="left" />
      <TapeReel side="right" />
      <TapeWindow />
      <CassetteLabel />
    </CassetteBody>
    <PlayButton />
    <NowPlayingInfo />
  </CassettePlayer>
  ```
- [x] **6.2** Build `<CassetteBody>` — SVG or div-based cassette shell, referencing `cassette.png` for proportions and style
- [x] **6.3** Build `<TapeReel>` — circular SVG reel with spokes; Framer Motion `animate` rotation during playback
- [x] **6.4** Build `<TapeWindow>` — the window cut-out showing the "tape" (dark ribbon)
- [x] **6.5** Build `<CassetteLabel>` — shows current song title + artist, styled as a cassette label
- [x] **6.6** Build `<PlayButton>` — large center button; triggers song fetch on click; toggles play/pause state
- [x] **6.7** Animate tape ribbon moving between reels on play (Framer Motion path or CSS transform)
- [x] **6.8** Add idle state animation (subtle floating/breathing cassette when no song is playing)
- [x] **6.9** Make cassette fully responsive (scales from mobile to desktop)

---

## Phase 7 — Frontend: Song Bubble System

- [x] **7.1** Build `<SongBubble>` component — displays song title, artist, genre chip, mood tag
- [x] **7.2** Implement bubble spawn animation: bubbles scale in from center of cassette and float outward using Framer Motion `motion.div` with `initial`, `animate`, `exit`
- [x] **7.3** Assign random orbit positions around the cassette (polar coordinates → CSS `transform`)
- [x] **7.4** Add bubble hover state: glow ring, slight scale-up pulse
- [x] **7.5** Add `onClick` handler: clicking a bubble replaces the current song with that bubble's song and re-fetches similar songs
- [x] **7.6** Add "AI pick" visual variant for Gemini-suggested bubbles (distinct color or badge)
- [x] **7.7** Handle bubble overflow gracefully (max 8 bubbles visible; animate out old ones when new ones come in)
- [x] **7.8** Add `<AnimatePresence>` to handle exit animations when bubbles disappear

---

## Phase 8 — Frontend: Landing Page

- [x] **8.1** Create `LandingPage.tsx` — full-screen layout
- [x] **8.2** Place `<CassettePlayer>` as the hero — centered, taking up most of the viewport
- [x] **8.3** Add ambient background (gradient, noise texture, or subtle particle effect consistent with `DESIGN.md`)
- [x] **8.4** Add header with `logo.png`, nav links (Favorites, Sign In), consistent with design system
- [x] **8.5** Wire Play button to `GET /api/songs/random` — fetch and display song, trigger cassette animation
- [x] **8.6** Wire song selection to `GET /api/songs/:id/similar` — populate bubbles around cassette
- [x] **8.7** Add `<NowPlaying>` footer bar — song title, artist, external link to listen, favorite button
- [x] **8.8** Implement Favorite button — calls `POST /api/favorites`, requires auth (prompt sign-in if not)
- [x] **8.9** Add page entrance animation (Framer Motion `motion.div` fade-in on mount)
- [x] **8.10** Polish: ensure smooth layout at all breakpoints (mobile, tablet, desktop)

---

## Phase 9 — Frontend: 404 Not Found Page

- [x] **9.1** Create `NotFoundPage.tsx`
- [x] **9.2** Design a retro cassette-themed 404 — broken/tangled tape metaphor, "Track Not Found", "The tape has snapped"
- [x] **9.3** Add a "Rewind Home" button that navigates back to `/`
- [x] **9.4** Add subtle Framer Motion animation (two tape halves drift apart on an easeInOut loop, reduced-motion safe)
- [x] **9.5** Ensure consistent design language (uses `surface-shell` card, JetBrains Mono, amber accent, same ambient glow as landing)

---

## Phase 10 — AI Integration (Gemini)

- [ ] **10.1** Install Google Generative AI SDK in backend (`pip install google-genai`)
- [ ] **10.2** Create `GeminiService` class in `backend/app/services/gemini.py`
- [ ] **10.3** Build prompt template: sends user's play history (last 10 songs) + preferences → asks Gemini to suggest 5 songs by title/artist/genre/mood
- [ ] **10.4** Parse Gemini response and cross-reference with seed DB — return matching songs or format new suggestions
- [ ] **10.5** Wire `GET /api/recommendations` route to `GeminiService`
- [ ] **10.6** Trigger recommendation fetch on frontend after user plays 3+ songs (track count in local state)
- [ ] **10.7** Surface Gemini suggestions as "AI pick" bubbles (see 7.6)
- [ ] **10.8** Add graceful fallback if Gemini API fails (return similar songs from DB instead)

---

## Phase 11 — User Preferences & Favorites UI

- [ ] **11.1** Build `<FavoritesDrawer>` or `<FavoritesPage>` — lists saved songs, each launchable
- [ ] **11.2** Build `<PreferencesPanel>` — genre and mood multi-select checkboxes; saves to `PUT /api/preferences`
- [ ] **11.3** Integrate preferences into Gemini prompt (Phase 10) and similar song query (Phase 4.3)
- [ ] **11.4** Show preference prompt after user's 2nd play if no preferences set
- [ ] **11.5** Persist favorites count badge in header nav

---

## Phase 12 — Routing & App Shell

- [ ] **12.1** Install React Router v6
- [ ] **12.2** Set up routes: `/` → `LandingPage`, `*` → `NotFoundPage`
- [ ] **12.3** Add `<AnimatePresence>` page transitions in the router
- [ ] **12.4** Add `<Suspense>` + loading skeleton for async page chunks

---

## Phase 13 — Polish & QA

- [ ] **13.1** Audit all animations — ensure 60fps, no jank on mid-range devices
- [ ] **13.2** Keyboard accessibility — Play button, bubble focus states, skip links
- [ ] **13.3** Test Clerk auth flow end-to-end (sign up → play → favorite → sign out)
- [ ] **13.4** Test API with no auth token (should get 401 on protected routes)
- [ ] **13.5** Test with empty DB (no songs) — show empty state gracefully
- [ ] **13.6** Cross-browser test: Chrome, Firefox, Safari
- [ ] **13.7** Mobile layout QA — cassette scales correctly, bubbles don't overflow
- [ ] **13.8** Lighthouse audit — target 90+ Performance, 100 Accessibility
- [ ] **13.9** Add `loading` and `error` UI states to all async operations

---

## Phase 14 — Deployment

- [ ] **14.1** Set up Vercel project, connect GitHub repo
- [ ] **14.2** Configure Vercel for frontend (root: `frontend/`, build: `npm run build`, output: `dist/`)
- [ ] **14.3** Deploy backend to Render or Railway (Flask app); or configure Vercel serverless functions
- [ ] **14.4** Set all production environment variables in Vercel and backend host dashboards
- [ ] **14.5** Swap `DATABASE_URL` to Supabase Postgres connection string in prod
- [ ] **14.6** Run `seed.py` against Supabase prod database
- [ ] **14.7** Configure CORS in Flask to allow production Vercel domain
- [ ] **14.8** Verify Clerk production keys are set and the Vercel domain is whitelisted in Clerk dashboard
- [ ] **14.9** Smoke test full flow in production: land → play → bubbles → auth → favorite → Gemini rec
- [ ] **14.10** Set up Vercel preview deployments for PRs

---

## Backlog / Nice-to-Have

- [ ] **B.1** Keyboard shortcuts: `Space` to play/pause, `→` to skip to next bubble song
- [ ] **B.2** Share button — copies a link with the current song pre-loaded
- [ ] **B.3** Mood filter UI — filter random songs by mood before hitting play
- [ ] **B.4** Recently played history drawer
- [ ] **B.5** Onboarding animation — cassette inserts into player on first visit
- [ ] **B.6** Dark/light mode toggle (if `DESIGN.md` supports it)
- [ ] **B.7** PWA support — offline fallback page, installable on mobile

---

## Dependency Map

```
Phase 0 → Phase 1
Phase 0 → Phase 2 → Phase 3 → Phase 4
Phase 1 → Phase 5
Phase 1 → Phase 6 → Phase 8
Phase 4 → Phase 7 → Phase 8
Phase 5 → Phase 8
Phase 3 → Phase 10 → Phase 8
Phase 8 → Phase 9 → Phase 12
Phase 12 → Phase 13 → Phase 14
```

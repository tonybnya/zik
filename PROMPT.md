# ZIK – AI-Powered Retro Cassette Player App

## Concept
A retro-themed music discovery web app built around a giant animated cassette tape player. Users hit play to receive a random focus/study song; similar songs bubble out from the tape player as animated orbs. An AI layer (Gemini) personalizes recommendations over time.

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | React + TypeScript                  |
| Styling          | Tailwind v4, HugeIcons              |
| Animation        | Framer Motion (primary) or GSAP     |
| Backend          | Flask + SQLAlchemy                  |
| Database         | SQLite (local dev) → Supabase (prod)|
| Auth             | Clerk                               |
| AI               | Gemini API (free tier)              |
| Deployment       | Vercel                              |
| Backend tooling  | uv, ty, ruff                        |

---

## Visual & Design System
- Follow `DESIGN.md` for all style, color, and typography decisions
- Cassette tape player UI is custom-designed, inspired by `cassette.png` in the project root
- Use `favicon.png` and `logo.png` where appropriate
- Aesthetic: premium, retro-modern, cinematic — not skeuomorphic kitsch

---

## Pages

### 1. Landing Page (Main App Page)
- Full-screen layout with a **giant cassette tape player** as the hero element
- A **single selector/play button** centered on or within the tape player
- On click: returns a random song + triggers tape animation (reels spin, tape moves)
- **Similar songs** animate outward from the center of the tape player as floating bubbles/orbs into the surrounding space
- Bubbles are clickable and launch the respective song
- Overall feel: eye-catching, premium, clean

### 2. 404 Not Found Page
- Thematically consistent with the retro cassette aesthetic
- Creative and memorable — not a generic error page

---

## Core Features

### Song Playback
- Play button → random song selected from the seeded library
- Song launches to an external player (YouTube, Spotify, etc.) or plays inline
- Tape player animates during playback

### Similar Songs (Bubble System)
- Similar songs surface as animated bubbles floating out from the tape player center
- Bubbles display song title, artist, and mood tag
- Clicking a bubble swaps it as the current track

### Song Library
- Pre-seeded with a large curated list of **lyric-free focus music**
- Categories: Lo-fi hip hop, Cinematic/Orchestral, Ambient, Nature Sounds, Jazz instrumental, Classical focus, Synthwave instrumental
- Each song entry includes: `title`, `artist`, `genre`, `mood[]`, `bpm`, `external_url`
- Aim for **150–300 songs** minimum at seed time

### AI Recommendations (Gemini)
- After a user plays 3+ songs or saves favorites, Gemini analyzes their pattern
- Returns additional song suggestions beyond the seeded library
- Suggestions are surfaced in the bubble system with a distinct "AI pick" visual marker

---

## Authentication & User Data (Clerk + DB)

### Auth
- Clerk handles all auth (sign up, sign in, session management)
- Protected routes: favorites, preferences, history

### Data Model (SQLAlchemy)

```
User          → clerk_id, email, created_at
PlayHistory   → user_id, song_id, played_at
Favorite      → user_id, song_id, saved_at
Preference    → user_id, preferred_genres[], preferred_moods[], updated_at
```

### Database Strategy
- **Local dev:** SQLite via SQLAlchemy
- **Prod:** Supabase (Postgres) — same models, swapped via `DATABASE_URL` env var

---

## Animations (Framer Motion)
- Tape reels spin continuously during playback
- Cassette tape ribbon animates on play/pause
- Similar song bubbles: scale in + float outward from tape center on mount
- Bubble hover: subtle pulse / glow effect
- Page transitions: smooth fade or slide

---

## Backend (Flask)

```
GET  /api/songs/random              → returns one random song
GET  /api/songs/:id/similar         → returns similar songs by mood/genre
GET  /api/recommendations           → Gemini-powered suggestions (auth required)
POST /api/history                   → log play event (auth required)
POST /api/favorites                 → save/unsave a song (auth required)
GET  /api/favorites                 → get user's favorites (auth required)
GET  /api/preferences               → get user preferences (auth required)
PUT  /api/preferences               → update user preferences (auth required)
```

---

## Project Structure

```
/
├── cassette.png
├── favicon.png
├── logo.png
├── DESIGN.md
├── PROMPT.md
├── TASKS.md
├── frontend/                        # React + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── components/
│   │   │   ├── CassettePlayer/
│   │   │   ├── SongBubble/
│   │   │   ├── NowPlaying/
│   │   │   └── UI/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── tailwind.config.ts
│   └── vite.config.ts
└── backend/                         # Flask
    ├── app/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── seeds/                   # Song library JSON
    ├── pyproject.toml
    └── .env
```

---

## Environment Variables

```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=          # sqlite:///dev.db OR supabase postgres URL

# Supabase (prod)
SUPABASE_URL=
SUPABASE_ANON_KEY=

# AI
GEMINI_API_KEY=

# Vercel
VERCEL_ENV=
```

---

## Deployment (Vercel)
- Frontend: standard Vite/React build output
- Backend: Flask deployed as Vercel serverless functions or a separate Render/Railway service
- Environment variables set per environment (preview / production) in Vercel dashboard
- CORS configured to allow frontend origin in all environments

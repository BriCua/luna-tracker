# Project Spec: Luna Tracker

> For pending tasks, see `PROJECT_TODO.md`.

---

## Overview

A mobile-first PWA period tracker built for a partner to monitor and support his girlfriend through her cycle. Designed for a single user, self-hosted on a home server accessible only via VPN or local network. The philosophy is empathy-first — every feature (tips, chat, notifications) exists to help the partner be more present and supportive, not just to log data.

---

## Tech Stack

- **Frontend Framework:** React 18 + Vite
- **Backend Framework:** Express.js (Node 20)
- **Database:** SQLite via `better-sqlite3` — single file at `/app/data/luna.db`, mounted as a Docker volume
- **State Management:** Zustand (in-memory, re-fetched on mount — no localStorage persistence needed)
- **API Communication:** Axios with Vite dev proxy (`/api → http://localhost:3000`)
- **Styling:** Tailwind CSS (mobile-first, utility-only)
- **Icons:** Lucide React
- **Push Notifications:** Web Push API with VAPID keys via `web-push` npm package
- **AI Chatbot:** Groq API (`llama-3.3-70b-versatile`) — proxied through Express, API key server-side only
- **Cron Scheduler:** `node-cron` — runs at 08:00 daily for notification triggers
- **Deployment:** Docker Compose — two containers (Nginx + Node), SQLite in named volume
- **Reverse Proxy:** Nginx (serves static frontend, proxies `/api/*` to backend container)
- **PWA:** `vite-plugin-pwa` with Workbox, custom service worker for push notification handling
- **Access Control:** VPN-only (Tailscale or WireGuard) — no public exposure

---

## Current Implementation State

### 1. Authentication

- **Logic:** No authentication. Single-user app on a private VPN network — access control is network-level (Tailscale/WireGuard).
- **Security:** No tokens or sessions. The assumption is that anyone who can reach the server's IP is authorized.
- **Session:** Not applicable.
- **Persistence:** Not applicable.

> If multi-user support is ever needed, add a simple PIN lock stored as a bcrypt hash in SQLite.

---

### 2. Data Structure

- **Table: `cycle`** (single row, updated in place)
  - `id` INTEGER PRIMARY KEY
  - `last_period_date` TEXT (ISO date, e.g. `2025-06-01`)
  - `cycle_length` INTEGER DEFAULT 28
  - `period_duration` INTEGER DEFAULT 5
  - `updated_at` TEXT (datetime)

- **Table: `push_subscriptions`** (one row per device/browser)
  - `id` INTEGER PRIMARY KEY AUTOINCREMENT
  - `endpoint` TEXT UNIQUE
  - `p256dh` TEXT
  - `auth` TEXT
  - `created_at` TEXT

- **Table: `notification_log`** (audit trail)
  - `id` INTEGER PRIMARY KEY AUTOINCREMENT
  - `type` TEXT (e.g. `"7_days"`, `"3_days"`, `"1_day"`)
  - `sent_at` TEXT

---

### 3. Folder Structure

- `server/src/`
  - `index.js` — Express app entry, middleware, route registration, cron import
  - `cron.js` — `node-cron` 08:00 daily job; checks days until period, sends push notifications
  - `db/index.js` — SQLite connection + schema initialization (creates tables if not exist)
  - `routes/cycle.js` — `GET /api/cycle/status`, `POST /api/cycle/setup`, `PUT /api/cycle/update`
  - `routes/push.js` — `GET /api/push/vapid-public-key`, `POST /api/push/subscribe`, `DELETE /api/push/unsubscribe`
  - `routes/chat.js` — `POST /api/chat` — proxies messages to Groq with phase context injected
  - `services/phaseEngine.js` — pure functions: `getCurrentPhase()`, `getNextPeriodDate()`, `PHASES` constant
  - `services/pushService.js` — `sendNotification()` wrapper around `web-push`
  - `services/groqClient.js` — `chat()` function with phase-aware system prompt

- `client/src/`
  - `App.jsx` — root; conditionally renders `SetupScreen` or `MainDashboard`
  - `sw.js` — custom service worker (precache + push event handler)
  - `store/cycleStore.js` — Zustand store: `phase`, `next`, `configured`, `fetchStatus()`, `setup()`
  - `components/SetupScreen.jsx` — first-time setup: date input, cycle length
  - `components/PhaseCard.jsx` — phase name, day indicator, color, tabbed tips
  - `components/Countdown.jsx` — days-until-period pill with urgency color
  - `components/ChatBot.jsx` — floating button + slide-up drawer, chat history, Groq integration
  - `components/NotificationSetup.jsx` — permission request + subscribe/unsubscribe toggle

---

### 4. Phase Engine Logic

- **Phase calculation:** `dayOfCycle = (differenceInDays(today, lastPeriodDate) % cycleLength) + 1`
- **Phases and day ranges (28-day default cycle):**
  | Phase | Days | Color |
  |---|---|---|
  | Menstruation | 1–5 | Rose |
  | Follicular | 6–13 | Green |
  | Ovulation | 14–16 | Amber |
  | Luteal | 17–28 | Purple |
- **Tips per phase:** Diet, activity, how to treat, how to talk — defined as constants in `phaseEngine.js`
- **Auto rollover:** The phase is recalculated on every `GET /api/cycle/status` call. No stored phase state — it's always derived from `last_period_date` and today's date.
- **Custom cycle length:** Luteal phase end is dynamic (`cycleLength` value), all others have fixed start days.

---

### 5. Push Notification System

- **VAPID keys:** Generated once, stored in `.env`, never rotated unless intentionally reset.
- **Subscription storage:** Browser push subscription object (`endpoint`, `p256dh`, `auth`) saved to SQLite on opt-in.
- **Trigger schedule:** `node-cron` fires at 08:00 daily. Checks `daysUntil` against `[7, 3, 2, 1]`.
- **Payload:** Title + body text tailored to urgency (e.g. "Period starts tomorrow").
- **iOS requirement:** User must "Add to Home Screen" in Safari before Web Push works (Safari 16.4+ only).
- **Failure handling:** Dead subscriptions (410 Gone) should be deleted from DB — implement in `pushService.js`.

---

### 6. AI Chatbot

- **Provider:** Groq (`llama-3.3-70b-versatile`)
- **System prompt injection:** Every request to `/api/chat` fetches the current phase from DB and injects phase name, day, and tip summaries into the Groq system prompt.
- **Security:** `GROQ_API_KEY` is backend-only (env var in Docker Compose). Never exposed to frontend.
- **History:** Conversation history is managed in React state (`ChatBot.jsx`) and passed with every request. No persistence between sessions.
- **Scope guardrails:** System prompt instructs the model to be helpful but never to diagnose medical conditions.

---

### 7. Docker & Deployment

- **Two containers:** `frontend` (Nginx) and `backend` (Node 20 Alpine)
- **Nginx role:** Serves built React static files; reverse-proxies `/api/*` to `backend:3000`
- **Backend is internal-only:** `expose: 3000` (not `ports:`) — not reachable from host directly
- **Data volume:** `db-data` named volume mounted at `/app/data` in the backend container
- **Restart policy:** `unless-stopped` on both containers
- **Build:** `docker compose up --build -d`

---

## Key Business Rules

- **Single user, no auth:** The app is designed for one couple. Network-level access control via VPN is sufficient.
- **Phase is always derived, never stored:** `last_period_date` + today → phase. No stale phase state.
- **GROQ_API_KEY must never reach the browser:** All AI requests route through Express. This is non-negotiable.
- **VAPID keys are stable:** Generate once, store in `.env`, back up. Regenerating breaks all existing push subscriptions.
- **SQLite file is the single source of truth:** The Docker volume must be backed up to preserve data across rebuilds.
- **Cycle length is configurable:** Default 28 days, but user can override. All phase math uses the stored value.
- **Notifications fire at 08:00 local server time:** Server timezone should match the user's timezone (set `TZ` env var in Docker Compose if needed).

---

## Out of Scope / Known Limitations

- No multi-user or multi-profile support
- No historical cycle logging or period prediction based on past cycles (manual entry only)
- No symptom or mood tracking (could be a future feature)
- No end-to-end encryption (VPN provides transport security; data at rest is unencrypted SQLite)
- No iOS home-screen install detection (user must be instructed manually)
- AI chatbot has no memory between sessions
- No offline chat (AI requires network); phase display works offline via service worker cache

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for LLM chat | `gsk_xxxxxxxxxxxx` |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key (also sent to frontend) | `BxxxxxxxxxxxxxxX` |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key (server-only, never exposed) | `xxxxxxxxxxxxxxxx` |
| `CLIENT_ORIGIN` | CORS origin allowed by Express | `http://localhost` |
| `TZ` | Server timezone for accurate cron timing | `Asia/Jakarta` |

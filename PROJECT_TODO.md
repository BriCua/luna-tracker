# Project TODOs: Luna Tracker

> Keep this file in sync with `PROJECT_SPEC.md`.
> Reprioritize rows freely as the project evolves.

Remaining tasks prioritized by importance for system stability, user experience, and long-term maintenance.

| Priority | Task | Category | Importance |
| :--- | :--- | :--- | :--- |
| 1 | **Phase Engine & Status API** | Core | Without this nothing else works — all UI derives from it |
| 2 | **SQLite Schema Init** | Core | DB must exist before any route can run |
| 3 | **SetupScreen + First-Run Flow** | UX | App is unusable without initial `last_period_date` input |
| 4 | **PhaseCard with Tips Tabs** | UX | The primary daily screen — main value prop of the app |
| 5 | **Push Notification Subscription** | Feature | Reminders are a core feature; needs VAPID setup + service worker |
| 6 | **node-cron Notification Job** | Feature | Triggers the 7/3/2/1 day reminders automatically |
| 7 | **Groq AI Chatbot** | Feature | Phase-aware assistant; enhances but doesn't block core use |
| 8 | **Docker Compose Setup** | Technical | Required for home server deployment |
| 9 | **Dead Subscription Cleanup** | Technical | Prevents push errors accumulating silently over time |
| 10 | **Timezone Config for Cron** | Technical | Cron fires at wrong local time if server TZ is not set |

---

## Detailed Breakdown

### High Priority (1–3)

- **Phase Engine & Status API:** Implement `getCurrentPhase(lastPeriodDate, cycleLength)` and `getNextPeriodDate()` in `server/src/services/phaseEngine.js` using `date-fns`. Formula: `dayOfCycle = (differenceInDays(today, lastPeriodDate) % cycleLength) + 1`. Map day to phase using the ranges in `PHASES` constant (menstruation 1–5, follicular 6–13, ovulation 14–16, luteal 17–end). Wire to `GET /api/cycle/status` which returns `{ configured, phase, next, settings }`. Phase is never stored — always recalculated on request.

- **SQLite Schema Init:** In `server/src/db/index.js`, open the database at `/app/data/luna.db` (path must exist — Docker volume handles this). Run `db.exec(...)` on startup to `CREATE TABLE IF NOT EXISTS` for `cycle`, `push_subscriptions`, and `notification_log`. Export the `db` instance for use in routes and services.

- **SetupScreen + First-Run Flow:** In `client/src/App.jsx`, call `fetchStatus()` on mount. If `configured === false`, render `<SetupScreen />`. The setup screen needs a date input (last period start), a cycle length input (default 28), and a submit button that calls `POST /api/cycle/setup`. On success, re-fetch status and transition to the main dashboard. Use HTML `<input type="date">` — no third-party date picker needed for MVP.

### Medium Priority (4–7)

- **PhaseCard with Tips Tabs:** In `client/src/components/PhaseCard.jsx`, display: phase name, phase color (background accent), day of cycle (`Day X of Y`), and a tab strip with four tabs — Diet, Activity, How to Treat, How to Talk. Each tab renders the corresponding tip text from the phase object. Use Tailwind for the color-coded accent. The `Countdown.jsx` component renders a pill showing days until next period, changing color as urgency increases (green → amber → red).

- **Push Notification Subscription:** In `NotificationSetup.jsx`, call `Notification.requestPermission()`. On grant, fetch VAPID public key from `GET /api/push/vapid-public-key`, call `navigator.serviceWorker.ready.pushManager.subscribe(...)`, and `POST /api/push/subscribe` with the subscription object. Store a boolean in Zustand (`notificationsEnabled`) and show toggle state in the UI. The service worker's `push` event handler in `src/sw.js` must call `self.registration.showNotification(data.title, { body, icon })`.

- **node-cron Notification Job:** In `server/src/cron.js`, schedule a job with `cron.schedule('0 8 * * *', ...)`. Fetch the cycle row from SQLite, compute `daysUntil = getNextPeriodDate(...)`. If `daysUntil` is in `[7, 3, 2, 1]`, fetch all rows from `push_subscriptions` and call `sendNotification()` for each. Log each send to `notification_log`. Import `cron.js` in `server/src/index.js` so it registers on startup.

- **Groq AI Chatbot:** In `server/src/services/groqClient.js`, initialize `new Groq({ apiKey: process.env.GROQ_API_KEY })`. The `chat(messages, phaseContext)` function prepends a system message with phase name, day, and tip summaries, then calls `groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [system, ...messages] })`. In `ChatBot.jsx`, maintain `messages` array in React state. On send, append user message, POST to `/api/chat`, append assistant reply. Render as a simple slide-up drawer triggered by a floating button.

### Low Priority (8–10)

- **Docker Compose Setup:** Write `server/Dockerfile` (Node 20 Alpine, copy `package*.json`, `npm ci --omit=dev`, copy `src/`), `client/Dockerfile` (multi-stage: Node build then Nginx), and `client/nginx.conf` (proxy `/api/` to `http://backend:3000/api/`, `try_files` fallback to `index.html`). Root `docker-compose.yml` should define `frontend` (ports 80:80) and `backend` (expose 3000, volume `db-data:/app/data`, env vars from `.env`). Add `TZ: Asia/Jakarta` (or user's timezone) to the backend service environment.

- **Dead Subscription Cleanup:** In `server/src/services/pushService.js`, wrap `webpush.sendNotification()` in a try/catch. If the error has `statusCode === 410` (subscription expired/unregistered), delete the row from `push_subscriptions` where `endpoint` matches. This prevents the subscription table from accumulating dead entries silently.

- **Timezone Config for Cron:** Add `TZ=Asia/Jakarta` (or correct timezone) to the backend service in `docker-compose.yml` under `environment`. Without this, `node-cron`'s `0 8 * * *` fires at 08:00 UTC, which may be the wrong local time. Validate by checking server time: `docker exec <backend-container> date`.

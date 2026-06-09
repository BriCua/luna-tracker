# Project TODOs: Luna Tracker

> Keep this file in sync with `PROJECT_SPEC.md`.
> Reprioritize rows freely as the project evolves.

Remaining tasks prioritized by importance for system stability, user experience, and long-term maintenance.

| Priority | Task                                    | Category  | Status  |
| :------- | :-------------------------------------- | :-------- | :------ |
| 1        | **SQLite Schema Init**                  | Core      | ✅ Done |
| 2        | **Phase Engine + Late Period Handling** | Core      | ✅ Done |
| 3        | **Cycle Routes**                        | Core      | ✅ Done |
| 4        | **Push Service**                        | Core      | ✅ Done |
| 5        | **Groq Client**                         | Core      | ✅ Done |
| 6        | **Chat Route**                          | Core      | ✅ Done |
| 7        | **Push Routes**                         | Core      | ✅ Done |
| 8        | **Cron Job**                            | Core      | ✅ Done |
| 9        | **Zustand Store**                       | Frontend  | ✅ Done |
| 10       | **App.tsx + Conditional Render**        | Frontend  | ✅ Done |
| 11       | **SetupScreen**                         | UX        | ✅ Done |
| 12       | **PhaseCard + Countdown**               | UX        | ✅ Done |
| 13       | **NotificationSetup**                   | Feature   | ✅ Done |
| 14       | **ChatBot Drawer**                      | Feature   | ✅ Done |
| 15       | **Service Worker**                      | Technical | ✅ Done |
| 16       | **Docker Compose + Dockerfiles**        | Technical | ✅ Done |
| 17       | **Timezone Config**                     | Technical | ✅ Done |

---

## Detailed Breakdown

### ✅ Completed — Backend

- **SQLite Schema Init** (`server/src/db/index.ts`): Opens DB at `/app/data/luna.db`, creates data directory if missing, runs `CREATE TABLE IF NOT EXISTS` for `cycle`, `push_subscriptions`, `notification_log`. WAL pragma and foreign keys enabled. Exports `db` singleton, `CycleSettings` type, and `PushSubscription` type.

- **Phase Engine** (`server/src/services/phaseEngine.ts`): `getCurrentPhase(lastPeriodDate, cycleLength)` calculates `dayOfCycle` via modulo, maps to phase via `PHASES` constant. Late period handling: if `rawDay >= cycleLength`, freezes at last luteal day, sets `isLate: true` and `daysLate: number` instead of rolling over silently. `getNextPeriodDate()` returns predicted date and `daysUntil` (clamped to 0 if already late). Exports `PhaseKey`, `PhaseTips`, `Phase`, `CurrentPhase`, `NextPeriod` types.

- **Cycle Routes** (`server/src/routes/cycle.ts`): `GET /api/cycle/status` returns `{ configured, phase, next, settings }` — returns `{ configured: false }` if no cycle exists. `POST /api/cycle/setup` inserts first cycle record, returns phase immediately. `PUT /api/cycle/update` updates existing record by latest `id`.

- **Push Service** (`server/src/services/pushService.ts`): `sendToAll(payload)` fetches all subscriptions from SQLite, calls `sendOne()` for each via `Promise.allSettled()`. `sendOne()` deletes subscription from DB on `410 Gone` response. VAPID configured at module load time via `webpush.setVapidDetails()`.

- **Groq Client** (`server/src/services/groqClient.ts`): `new Groq()` auto-reads `GROQ_API_KEY`. `chat(messages, phase)` prepends phase-aware system prompt built by `buildSystemPrompt(phase)`. System prompt includes late period context if `phase.isLate`. Returns `{ reply, tokens }`.

- **Chat Route** (`server/src/routes/chat.ts`): `POST /api/chat` validates messages array, fetches current phase from DB, calls `groqClient.chat()`, returns `{ reply }`. Logs token usage server-side only.

- **Push Routes** (`server/src/routes/push.ts`): `GET /api/push/vapid-public-key` returns public key from env. `POST /api/push/subscribe` upserts subscription using `ON CONFLICT DO UPDATE`. `DELETE /api/push/unsubscribe` removes by endpoint, returns 404 if not found.

- **Cron Job** (`server/src/cron.ts`): `0 8 * * *` schedule. Fetches cycle, computes `daysUntil`, checks against `[7, 3, 2, 1]`. Calls `sendToAll()` with urgency-appropriate payload from `buildPayload(daysUntil)`. Logs to `notification_log` table after send.

---

### ✅ Completed — Frontend

- **Zustand Store** (`client/src/store/cycleStore.ts`): Cycle state management with Axios actions for status and setup.
- **App.tsx**: Main orchestrator with conditional rendering and global loading states.
- **SetupScreen**: Mobile-friendly onboarding form with date picker and cycle length slider.
- **PhaseCard + Countdown**: High-impact UI displaying phase names, color-coded accents, and empathetic tips.
- **NotificationSetup**: Web Push subscription workflow with VAPID key conversion.
- **ChatBot Drawer**: Floating AI chat with phase-aware context and empathetic system prompt.
- **Service Worker**: PWA support with precaching and push notification event handling.

---

### ✅ Completed — Infrastructure

- **Docker Compose**: Orchestrates `frontend` (Nginx) and `backend` (Node) containers.
- **Dockerfiles**: Multi-stage builds for optimized image sizes.
- **Nginx Config**: Reverse proxy for API calls and SPA routing support.
- **Timezone Config**: `TZ: Asia/Jakarta` for accurate daily cron notifications.

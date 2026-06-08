# Period Tracker — Setup Guide

> Single monorepo with `client/` and `server/` directories, fully containerized with Docker Compose.

---

## Prerequisites

Make sure these are installed on your home server / dev machine:

- **Docker** + **Docker Compose** (v2)
- **Node.js 20+** (for local dev without Docker)
- **Git**

---

## Step 1 — Scaffold the Monorepo

```bash
mkdir luna-tracker && cd luna-tracker
git init

mkdir client server
touch docker-compose.yml .env .gitignore
echo "node_modules/\n.env\ndata/" >> .gitignore
```

---

## Step 2 — Set Up the Express Backend

### 2.1 Initialize the Node project

```bash
cd server
npm init -y
npm install express better-sqlite3 web-push node-cron cors dotenv groq-sdk
npm install -D nodemon
```

### 2.2 Create the folder structure

```bash
mkdir -p src/routes src/services src/db
touch src/index.js src/db/index.js src/services/phaseEngine.js \
      src/services/pushService.js src/services/groqClient.js \
      src/routes/cycle.js src/routes/push.js src/routes/chat.js \
      src/cron.js
```

### 2.3 Database setup (`src/db/index.js`)

```js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/luna.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS cycle (
    id INTEGER PRIMARY KEY,
    last_period_date TEXT NOT NULL,
    cycle_length INTEGER DEFAULT 28,
    period_duration INTEGER DEFAULT 5,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
```

### 2.4 Phase engine (`src/services/phaseEngine.js`)

```js
const { differenceInDays, addDays, format } = require('date-fns');

const PHASES = {
  menstruation: {
    name: 'Menstruation',
    color: '#e57373',
    dayRange: [1, 5],
    tips: {
      diet: 'Iron-rich foods (spinach, lentils, red meat). Stay hydrated. Reduce caffeine.',
      activity: 'Light walks, gentle yoga, stretching. Rest is valid.',
      howToTreat: 'Be extra patient. Ask what she needs — sometimes it\'s space, sometimes comfort. No pressure.',
      talk: 'Keep it calm and low-effort. Avoid debates or big decisions. Just be present.',
    },
  },
  follicular: {
    name: 'Follicular',
    color: '#81c784',
    dayRange: [6, 13],
    tips: {
      diet: 'Light, fresh foods. Eggs, fermented foods, broccoli. Great time for trying new recipes.',
      activity: 'Energy is rising — cardio, strength training, new workouts.',
      howToTreat: 'She\'s sociable and optimistic. Great time for dates, plans, and new experiences.',
      talk: 'She\'s open and communicative. Good time for important conversations.',
    },
  },
  ovulation: {
    name: 'Ovulation',
    color: '#ffb74d',
    dayRange: [14, 16],
    tips: {
      diet: 'Anti-inflammatory foods — leafy greens, berries, zinc-rich foods.',
      activity: 'Peak energy. High-intensity workouts, group activities.',
      howToTreat: 'She\'s at her most confident and social. Plan something special.',
      talk: 'Best time for deep conversations. She\'s articulate and empathetic right now.',
    },
  },
  luteal: {
    name: 'Luteal',
    color: '#9575cd',
    dayRange: [17, 28],
    tips: {
      diet: 'Magnesium-rich foods (dark chocolate, nuts, seeds). Complex carbs help mood. Reduce salt.',
      activity: 'Moderate — pilates, swimming, walks. Avoid overexertion.',
      howToTreat: 'She may need more reassurance. Check in often. Small gestures matter a lot.',
      talk: 'She may be more sensitive. Choose words carefully, be extra affirming.',
    },
  },
};

function getCurrentPhase(lastPeriodDate, cycleLength = 28) {
  const today = new Date();
  const start = new Date(lastPeriodDate);
  const dayOfCycle = (differenceInDays(today, start) % cycleLength) + 1;

  for (const [key, phase] of Object.entries(PHASES)) {
    const [min, max] = phase.dayRange;
    const adjustedMax = key === 'luteal' ? cycleLength : max;
    if (dayOfCycle >= min && dayOfCycle <= adjustedMax) {
      return { key, ...phase, dayOfCycle, cycleLength };
    }
  }

  return { key: 'luteal', ...PHASES.luteal, dayOfCycle, cycleLength };
}

function getNextPeriodDate(lastPeriodDate, cycleLength = 28) {
  const start = new Date(lastPeriodDate);
  const today = new Date();
  const dayOfCycle = differenceInDays(today, start) % cycleLength;
  const daysUntilNext = cycleLength - dayOfCycle;
  return { date: format(addDays(today, daysUntilNext), 'yyyy-MM-dd'), daysUntil: daysUntilNext };
}

module.exports = { getCurrentPhase, getNextPeriodDate, PHASES };
```

### 2.5 VAPID keys — generate once

```bash
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log(keys);"
```

Copy the output into your `.env` file (see Step 6).

### 2.6 Push service (`src/services/pushService.js`)

```js
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    console.error('Push failed:', err.statusCode, err.body);
  }
}

module.exports = { sendNotification };
```

### 2.7 Groq client (`src/services/groqClient.js`)

```js
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function chat(messages, phaseContext) {
  const systemPrompt = `You are a compassionate health assistant for a period tracking app. 
The user's girlfriend is currently in the ${phaseContext.name} phase (day ${phaseContext.dayOfCycle} of her cycle).
Phase tips: Diet — ${phaseContext.tips.diet}. Activity — ${phaseContext.tips.activity}.
Be warm, practical, and concise. Focus on evidence-based advice. Never diagnose.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 512,
  });

  return response.choices[0].message.content;
}

module.exports = { chat };
```

### 2.8 Routes

**`src/routes/cycle.js`**
```js
const router = require('express').Router();
const db = require('../db');
const { getCurrentPhase, getNextPeriodDate } = require('../services/phaseEngine');

router.get('/status', (req, res) => {
  const row = db.prepare('SELECT * FROM cycle ORDER BY id DESC LIMIT 1').get();
  if (!row) return res.json({ configured: false });

  const phase = getCurrentPhase(row.last_period_date, row.cycle_length);
  const next = getNextPeriodDate(row.last_period_date, row.cycle_length);
  res.json({ configured: true, phase, next, settings: row });
});

router.post('/setup', (req, res) => {
  const { last_period_date, cycle_length = 28, period_duration = 5 } = req.body;
  db.prepare(`
    INSERT INTO cycle (last_period_date, cycle_length, period_duration)
    VALUES (?, ?, ?)
  `).run(last_period_date, cycle_length, period_duration);
  res.json({ ok: true });
});

router.put('/update', (req, res) => {
  const { last_period_date, cycle_length, period_duration } = req.body;
  db.prepare(`
    UPDATE cycle SET last_period_date=?, cycle_length=?, period_duration=?, updated_at=datetime('now')
    WHERE id=(SELECT MAX(id) FROM cycle)
  `).run(last_period_date, cycle_length, period_duration);
  res.json({ ok: true });
});

module.exports = router;
```

**`src/routes/push.js`**
```js
const router = require('express').Router();
const db = require('../db');

router.get('/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  db.prepare(`
    INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth)
    VALUES (?, ?, ?)
  `).run(endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

router.delete('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').run(endpoint);
  res.json({ ok: true });
});

module.exports = router;
```

**`src/routes/chat.js`**
```js
const router = require('express').Router();
const db = require('../db');
const { getCurrentPhase } = require('../services/phaseEngine');
const { chat } = require('../services/groqClient');

router.post('/', async (req, res) => {
  const { messages } = req.body;
  const row = db.prepare('SELECT * FROM cycle ORDER BY id DESC LIMIT 1').get();
  if (!row) return res.status(400).json({ error: 'Cycle not configured' });

  const phase = getCurrentPhase(row.last_period_date, row.cycle_length);
  const reply = await chat(messages, phase);
  res.json({ reply });
});

module.exports = router;
```

### 2.9 Cron job (`src/cron.js`)

```js
const cron = require('node-cron');
const db = require('./db');
const { getNextPeriodDate } = require('./services/phaseEngine');
const { sendNotification } = require('./services/pushService');

cron.schedule('0 8 * * *', async () => {
  const row = db.prepare('SELECT * FROM cycle ORDER BY id DESC LIMIT 1').get();
  if (!row) return;

  const { daysUntil } = getNextPeriodDate(row.last_period_date, row.cycle_length);
  const notifyDays = [7, 3, 2, 1];

  if (!notifyDays.includes(daysUntil)) return;

  const subs = db.prepare('SELECT * FROM push_subscriptions').all();
  const payload = {
    title: '🌸 Period Reminder',
    body: daysUntil === 1
      ? "Period starts tomorrow. Be extra kind today 💜"
      : `Period in ${daysUntil} days. Check the app for tips.`,
    daysUntil,
  };

  for (const sub of subs) {
    await sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
  }
});
```

### 2.10 Main entry (`src/index.js`)

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./cron');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/cycle', require('./routes/cycle'));
app.use('/api/push', require('./routes/push'));
app.use('/api/chat', require('./routes/chat'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(3000, () => console.log('Server running on :3000'));
```

### 2.11 Update `package.json` scripts

```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js"
}
```

### 2.12 Test the backend locally

```bash
mkdir -p ../data
node src/index.js

# In another terminal:
curl -X POST http://localhost:3000/api/cycle/setup \
  -H "Content-Type: application/json" \
  -d '{"last_period_date":"2025-06-01","cycle_length":28}'

curl http://localhost:3000/api/cycle/status
```

You should get back the current phase with tips.

---

## Step 3 — Set Up the React Frontend

### 3.1 Scaffold with Vite

```bash
cd ../client
npm create vite@latest . -- --template react
npm install
npm install axios zustand date-fns
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```

### 3.2 Configure Tailwind (`tailwind.config.js`)

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.3 Configure PWA in `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Luna Tracker',
        short_name: 'Luna',
        theme_color: '#9575cd',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^\/api\//,
          handler: 'NetworkFirst',
        }],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

The proxy means your frontend dev server forwards `/api/*` to Express — no CORS issues in development.

### 3.4 Create the Zustand store (`src/store/cycleStore.js`)

```js
import { create } from 'zustand'
import axios from 'axios'

export const useCycleStore = create((set) => ({
  phase: null,
  next: null,
  configured: false,
  loading: true,

  fetchStatus: async () => {
    const { data } = await axios.get('/api/cycle/status')
    set({ ...data, loading: false })
  },

  setup: async (payload) => {
    await axios.post('/api/cycle/setup', payload)
    const { data } = await axios.get('/api/cycle/status')
    set({ ...data, loading: false })
  },
}))
```

### 3.5 Build your key components

**Components to create in `src/components/`:**

- `SetupScreen.jsx` — date picker for last period, cycle length input
- `PhaseCard.jsx` — large phase display with color, day count, tips tabs (diet / activity / how to treat / how to talk)
- `Countdown.jsx` — days until next period pill
- `ChatBot.jsx` — floating chat button + drawer, sends messages to `/api/chat`
- `NotificationSetup.jsx` — "Enable reminders" button that calls `/api/push/subscribe`

The app's `App.jsx` logic is simple:

```jsx
const { configured, loading, fetchStatus } = useCycleStore()
useEffect(() => { fetchStatus() }, [])

if (loading) return <Spinner />
if (!configured) return <SetupScreen />
return <MainDashboard />
```

### 3.6 Service Worker for push notifications (`public/sw.js`)

Vite PWA generates this automatically. You just need to handle the push event in your custom SW or use the workbox default. For custom push handling, add to your `vite.config.js` PWA config:

```js
strategies: 'injectManifest',
srcDir: 'src',
filename: 'sw.js',
```

And create `src/sw.js`:
```js
import { precacheAndRoute } from 'workbox-precaching'
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})
```

---

## Step 4 — Docker Setup

### 4.1 Backend Dockerfile (`server/Dockerfile`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### 4.2 Frontend Dockerfile (`client/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 4.3 Nginx config (`client/nginx.conf`)

```nginx
server {
  listen 80;

  location /api/ {
    proxy_pass http://backend:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
}
```

### 4.4 Docker Compose (`docker-compose.yml` in root)

```yaml
services:
  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./server
    expose:
      - "3000"
    volumes:
      - db-data:/app/data
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
      - VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
      - CLIENT_ORIGIN=http://localhost
    restart: unless-stopped

volumes:
  db-data:
```

---

## Step 5 — Environment Variables

Create `.env` in the project root (never commit this):

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Generate VAPID keys once with:
```bash
cd server && node -e "const w=require('web-push');console.log(w.generateVAPIDKeys())"
```

---

## Step 6 — Build and Run

```bash
# From project root
docker compose up --build -d

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up --build -d backend   # backend only
docker compose up --build -d frontend  # frontend only
```

App is now live at `http://<your-server-ip>` on your local/VPN network.

---

## Step 7 — PWA Install (Mobile)

### Android (Chrome)
1. Open the app in Chrome
2. Tap the three-dot menu → "Add to Home Screen"
3. Accept notification permission when prompted

### iOS (Safari 16.4+)
1. Open the app in Safari
2. Tap the Share button → "Add to Home Screen"
3. After adding, reopen from Home Screen (PWA mode required for notifications)

---

## Step 8 — VPN-Only Access (Tailscale recommended)

If using **Tailscale**:
```bash
# On your home server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
The server gets a stable `100.x.x.x` Tailscale IP. Share access with your phone via Tailscale's admin panel. No port forwarding needed.

If using **WireGuard**, make sure port 80 is only bound to the WireGuard interface (`ListenAddress` in your WireGuard server config).

---

## Folder Structure (Final)

```
luna-tracker/
├── .env
├── .gitignore
├── docker-compose.yml
│
├── client/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── sw.js
│       ├── store/
│       │   └── cycleStore.js
│       └── components/
│           ├── SetupScreen.jsx
│           ├── PhaseCard.jsx
│           ├── Countdown.jsx
│           ├── ChatBot.jsx
│           └── NotificationSetup.jsx
│
├── server/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── cron.js
│       ├── db/
│       │   └── index.js
│       ├── routes/
│       │   ├── cycle.js
│       │   ├── push.js
│       │   └── chat.js
│       └── services/
│           ├── phaseEngine.js
│           ├── pushService.js
│           └── groqClient.js
│
└── data/               ← created by Docker volume, gitignored
    └── luna.db
```

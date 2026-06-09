# Project Spec: Luna Tracker

> For pending tasks, see `PROJECT_TODO.md`.

---

## Overview

A mobile-first PWA period tracker built for a partner to monitor and support his girlfriend through her cycle. Designed for a single user, self-hosted on a home server accessible only via VPN or local network. The philosophy is empathy-first — every feature (tips, chat, notifications) exists to help the partner be more present and supportive, not just to log data.

---

## Tech Stack

### Frontend

- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`
- **State Management:** Zustand (in-memory, re-fetched on mount)
- **Icons:** Lucide React
- **PWA:** `vite-plugin-pwa` with Workbox
- **Language:** TypeScript strict mode

### Backend

- **Framework:** Express.js + Node 22 + TypeScript
- **Database:** SQLite via `better-sqlite3` — single file at `/app/data/luna.db`
- **AI Chatbot:** Groq API (`llama-3.3-70b-versatile`)
- **Push Notifications:** Web Push API
- **Cron Scheduler:** `node-cron`
- **Module System:** ESM (`NodeNext`)

### Infrastructure

- **Deployment:** Docker Compose
- **Base Images:** `node:22-bookworm-slim` (Backend), `node:22-alpine` / `nginx:alpine` (Frontend)
- **Reverse Proxy:** Nginx
- **Access Control:** VPN-only

---

## Current Implementation State

### 1. Authentication
- Network-level VPN access control. No in-app auth.

### 2. Data Structure
- `cycle`: Settings (date, length, duration).
- `push_subscriptions`: Web Push endpoints.
- `notification_log`: Audit trail for daily alerts.

### 3. Implementation Status
All components (Frontend & Backend) are **100% Complete**.

---

## Key Business Rules

- **Phase is derived:** Recalculated on every request from `last_period_date`.
- **Late periods:** Freeze at last luteal day, increment `daysLate`.
- **AI Guardrails:** No medical diagnosis, no pregnancy suggestions.
- **Security:** API keys never reach the browser.
- **Notifications:** Daily at 08:00 local time.

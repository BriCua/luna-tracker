# 🌙 Luna Tracker

An empathy-first, mobile-first PWA period tracker designed for partners. Luna helps you stay informed and supportive through every phase of her cycle with automated notifications and an AI-powered empathy guide.

## ✨ Features

- **Phase Engine**: Accurately derives the current cycle phase (Menstruation, Follicular, Ovulation, Luteal).
- **Empathy-First Tips**: Dynamic suggestions for Diet, Activity, Communication, and Care based on the current phase.
- **Late Period Handling**: Calmly handles late periods without silent rollovers, providing context and reassurance.
- **Luna Guide**: A phase-aware AI chatbot (powered by Groq Llama 3) to answer questions and provide support strategies.
- **Daily Notifications**: Opt-in web push notifications sent daily at 08:00 to keep you prepared.
- **Privacy First**: Self-hosted, single-user design. No cloud tracking. Your data stays in your SQLite database.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Zustand, Lucide Icons.
- **Backend**: Node.js 22, Express, SQLite (better-sqlite3).
- **AI**: Groq SDK (Llama 3.3 70B).
- **Infrastructure**: Docker Compose, Nginx.

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Or Node.js 22+ (for local development)

### Deployment (Recommended)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/BriCua/luna-tracker.git
   cd luna-tracker
   ```

2. **Setup Environment Variables**:
   Create a `.env` file in the root:

   ```env
   GROQ_API_KEY=your_key_here
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   CLIENT_ORIGIN=http://localhost:8080
   TZ=Asia/Jakarta
   ```

3. **Deploy with Docker**:
   ```bash
   npm run docker:up
   ```
   Access the app at `http://localhost:8080`.

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. **Run in dev mode**:
   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

## 📱 PWA Installation

- **iOS**: Open in Safari, tap "Share", then "Add to Home Screen".
- **Android**: Open in Chrome, tap the three dots, then "Install App".
- **Note**: Notifications require the app to be added to the home screen on iOS.

## 🔒 Security

Designed for use over a private VPN (Tailscale, WireGuard). Access control is managed at the network level.

---

_Created for partners who want to be more present._

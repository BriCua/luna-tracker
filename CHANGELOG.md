# Changelog: Luna Tracker

## [1.0.0] - 2026-06-09

### Added
- **Frontend Core**: Implemented Zustand store for cycle state management.
- **Frontend UI**: Created SetupScreen, PhaseCard, Countdown, NotificationSetup, and ChatBot components.
- **PWA Support**: Added Vite PWA plugin and custom Service Worker for push notifications.
- **Design System**: Integrated Soft UI aesthetics with calming lavender/green palette and Lora/Raleway fonts.
- **Infrastructure**: Added Dockerfiles for client/server and a root Docker Compose configuration.
- **Reverse Proxy**: Configured Nginx for frontend serving and backend API proxying.
- **Shortcuts**: Added root `package.json` with `npm run dev` and `npm run docker:up` scripts.

### Fixed
- **Docker Stability**: Switched backend to `node:22-bookworm-slim` to fix `better-sqlite3` native module compilation errors on Alpine.
- **Docker Optimization**: Optimized Dockerfile stages to compile native modules once and copy `node_modules` to final image.
- **Port Conflicts**: Changed default production port to `8080` to avoid conflicts with other local services (e.g., AdGuard).
- **ESM Issues**: Fixed `__dirname` and API key loading issues in backend using `import.meta.url` and top-level `dotenv` config.
- **UI Refinements**: Fixed missing Lucide icons, added proper page title ("Luna Tracker"), and improved PWA meta tags.
- **Type Safety**: Resolved `verbatimModuleSyntax` errors across all components.

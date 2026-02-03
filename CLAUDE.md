# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Docker (full stack)
```bash
docker compose up --build        # Build and start all services
docker compose up --build gateway # Rebuild only the gateway
docker compose logs backend      # View backend logs
```

### Backend (Express.js, port 3001)
```bash
cd backend
npm install
npm run dev                      # Dev server with watch (tsx)
npm run build                    # TypeScript compilation (tsc)
npm start                        # Run compiled output (dist/index.js)
npm run generate-types           # Generate types from IBKR OpenAPI spec
```

### Frontend (React + Vite, port 3000)
```bash
cd frontend
npm install
npm run dev                      # Vite dev server with API proxy to :3001
npm run build                    # tsc + vite build
npm run lint                     # ESLint (zero warnings policy)
```

## Architecture

Three Docker services connected via `ibkr-network` bridge:

```
Browser → Frontend (React/Nginx :3000)
              → Backend (Express :3001)
                    → IBKR Gateway (Java :5000)
                          → Interactive Brokers API
```

**Gateway** downloads the IBKR Client Portal Gateway binary at build time from IBKR's servers. Users must manually authenticate at `https://localhost:5000` (browser + 2FA) before the dashboard works. The backend keeps the session alive via `/tickle` every 60s.

**Backend** is a proxy layer between the frontend and the IBKR gateway. It handles:
- Session management (`services/session-manager.ts`) — auto-tickle, status polling
- Dual-layer caching (`services/cache-manager.ts`) — in-memory + filesystem JSON in `./cache/`
- Historical data accumulation (`routes/performance.ts`) — merges new data with persisted history, deduplicates by date/conid/amount keys
- All IBKR API calls go through `services/ibkr-client.ts` which uses native fetch with `rejectUnauthorized: false` for the gateway's self-signed cert

**Frontend** is a React SPA using TanStack Query for server state. All API calls go to `/api/*` which Vite proxies to the backend in dev, and Nginx proxies in production. Charts use Recharts (pie, area, bar) and Lightweight Charts (TradingView financial charts).

## Key Patterns

- **Backend route files** must explicitly annotate the router type: `export const fooRouter: RouterType = Router()` (using `import type { Router as RouterType } from 'express'`). Without this, TypeScript emits TS2742 errors about non-portable type inference.
- **Frontend path alias**: `@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts).
- **Frontend tsconfig** enforces `noUnusedLocals` and `noUnusedParameters` — prefix intentionally unused params with `_`.
- **Cache TTLs**: account/positions 5min, allocation 10min, performance 1hr, historical 24hr, market data 30s.
- Backend uses `.js` extensions in imports (`from '../services/ibkr-client.js'`) as required by NodeNext module resolution.

## Services & Ports

| Service  | Port | Tech                          |
|----------|------|-------------------------------|
| Frontend | 3000 | React 18, Vite, Tailwind CSS  |
| Backend  | 3001 | Express.js, TypeScript        |
| Gateway  | 5000 | IBKR Client Portal (Java/JRE) |

# Touch Grass Relay — Server

Collaborative running backend with real-time GPS tracking, anime-style power level tiers, and Socket.io.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server (dev mode with hot reload)
npm run dev

# In another terminal, simulate a 4-runner session
npm run fake-gps
```

## Requirements

- Node.js 18+
- PostgreSQL (optional for Phase 1 — in-memory store used by default)
- Redis (optional for Phase 1 — not required for single-instance dev)

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/rooms` | Create a room |
| `POST` | `/api/rooms/join` | Join by code |
| `POST` | `/api/rooms/:id/start-and-broadcast` | Start the run (host only) |
| `POST` | `/api/rooms/:id/stop-and-broadcast` | Stop the run (host only) |
| `GET`  | `/api/rooms/:id` | Get room state |
| `GET`  | `/api/rooms/:id/result` | Get final result |

## WebSocket

Connect to `ws://localhost:3001` with query params `roomId`, `userId`, `displayName`.

**Events received:**
- `state` — periodic room state updates
- `tier_unlocked` — anime power level unlocked
- `run_ended` — final result with story and badges
- `member_joined` / `member_left`

**Events to send:**
- `points` — `{ batch: [{ lat, lon, ts, acc }] }`

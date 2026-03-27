# Tic-Tac-Toe Multiplayer (Nakama + React)

Production-ready multiplayer Tic-Tac-Toe with server-authoritative gameplay using Nakama and a React frontend.

## Architecture

- Authoritative backend: all game state mutations happen in Nakama match handlers (`backend/nakama/src/main.ts`)
- Real-time sync: WebSocket `onmatchdata` state broadcasts only
- Frontend behavior: client sends intents (`submit_move`, `rematch_request`) and renders server state
- Shared contracts: message and state types in `shared/src/types.ts`

### Server-Authoritative Match State

The runtime tracks:

- board (9 cells)
- players (X/O, userId, username, connection state)
- turn/current player
- phase (`waiting` | `playing` | `finished`)
- timer deadline (server tick based)
- winner and win line
- move history

### Match Flows

- Matchmaking: `find_match` reuses the oldest waiting room, creates one only when none are valid
- Private room: `create_match_room` + `join_match_room`
- Reconnect: client restores `ACTIVE_MATCH_KEY`, rejoins room, and pulls authoritative state
- Timer: server closes turn on timeout and awards win to opponent

## Project Structure

- `frontend/`: Vite + React + TypeScript client
- `backend/nakama/`: Nakama runtime module and SQL schema
- `shared/`: Shared TypeScript types and contracts
- `docker-compose.yml`: Local Postgres + Nakama stack
- `.env.example`: Safe environment template for frontend values

## Tech Stack

- Frontend: React, Vite, TypeScript, Zustand, Framer Motion, Tailwind CSS
- Backend runtime: Nakama JavaScript/TypeScript runtime
- Database: PostgreSQL
- Orchestration: Docker Compose

## Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose

## Environment Setup

1. Create local environment files:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

2. Update values for your environment:

- `VITE_NAKAMA_HOST`
- `VITE_NAKAMA_PORT`
- `VITE_SERVER_KEY`

Optional backend override for Docker Compose:

- `POSTGRES_PASSWORD` (defaults to `changeme_local_only` if not provided)

## Run Locally

### 1. Start backend services

```bash
docker compose up --build
```

Default endpoints:

- Nakama API: `http://127.0.0.1:7350`
- Nakama Console: `http://127.0.0.1:7351`

### 2. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in terminal.

## Multiplayer Testing (2 Browsers)

1. Open two browser windows (or one normal + one incognito).
2. In window A, create a room.
3. In window B, join with the room ID or use auto-match.
4. Verify:
   - turn enforcement works
   - invalid moves are rejected
   - win/draw resolution syncs on both clients
   - reconnection restores state

Optional scripted E2E test:

```bash
cd frontend
npm run test:e2e
```

The E2E suite validates:

- matchmaking reuses one waiting match for both players
- room create/join flow starts game
- turn enforcement and move rejection
- winner detection and finish state
- leaderboard and history persistence
- rematch transition
- reconnect state recovery
- persisted usernames (no placeholder names)

## Continuous Test Loop

Use this loop for production hardening:

1. Build backend + frontend.
2. Start Nakama + Postgres via Docker.
3. Run scripted E2E (`npm run test:e2e`).
4. Run manual 2-browser validation (room + matchmaking + reconnect + timeout).
5. Fix any issue and repeat.

## Build

```bash
cd frontend
npm run build
```

## Deployment

1. Build and push frontend and backend images.
2. Use managed Postgres in production.
3. Set secure runtime values:
   - strong Nakama server key
   - TLS enabled endpoints
   - restricted network access
4. Run Nakama DB migrations before rollout.
5. Configure CORS/WebSocket access for frontend domain.

`docker-compose.yml` runs only local services on an internal bridge network (`shared_runtime_net`) with no required external Docker network.

## Security Notes

- No real secrets should be committed.
- Keep `.env` and `.env.local` untracked.
- Replace placeholder keys and passwords before production deployment.

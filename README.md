# Multiplayer Tic-Tac-Toe (React + Nakama)

Production-ready multiplayer Tic-Tac-Toe with a server-authoritative Nakama runtime and a React frontend.

## Live Links
- Latest deployment: https://frontend-one-chi-31.vercel.app/
- GitHub repository (Jatin): https://github.com/Jatin-cheti/tic-tac-toe-game

## Project Overview
This project uses an authoritative multiplayer model.
The frontend only sends player intents, and the backend validates every move, turn, and match result.

## Tech Stack
- Frontend: React 19, TypeScript, Vite, Zustand, React Query, Tailwind CSS, Framer Motion
- Backend: Nakama TypeScript runtime module
- Database: PostgreSQL 15
- Infra: Docker Compose, GitHub Actions
- Testing: Node E2E scripts + Playwright UI tests

## Repository Structure
The actual app workspace is under `tic-tac-toe-game`:

```text
tic-tac-toe-game/
	backend/
	frontend/
	shared/
	tests/
		e2e/
		unit/
		scripts/
	.github/workflows/
	docker-compose.yml
	package.json
```

## Architecture
### Frontend
- App orchestration: `frontend/src/App.tsx`
- State and networking flow: `frontend/src/store/gameStore.ts`
- Nakama client bootstrap: `frontend/src/lib/nakama.ts`

### Backend (Nakama)
- Match lifecycle: `backend/nakama/src/match/matchHandler.ts`
- Game rules and win logic: `backend/nakama/src/match/gameLogic.ts`
- RPC endpoints: `backend/nakama/src/controllers/rpcController.ts`
- Matchmaking/stats/services: `backend/nakama/src/services/`

### Authoritative Data Flow
1. Client authenticates with Nakama.
2. Client calls RPC for create/join/matchmaking.
3. Server creates or reuses authoritative match state.
4. Client submits move intents.
5. Server validates legality, resolves result, persists stats, and broadcasts state.
6. Frontend renders server state only.

## Quick Start (Local)
1. Clone and move to project workspace.

```bash
git clone https://github.com/Jatin-cheti/tic-tac-toe-game.git
cd tic-tac-toe-game/tic-tac-toe-game
```

2. Install dependencies.

```bash
npm install --workspaces
```

3. Build frontend and backend runtime.

```bash
npm run build
```

4. Start backend services.

```bash
docker compose up -d
```

5. Start frontend.

```bash
npm --workspace frontend run dev
```

## Deployment and CI
- CI workflow: `.github/workflows/ci.yml`
- Deployment workflow: `.github/workflows/deploy.yml`
- Optional Vercel deployment secrets:
	- `VERCEL_TOKEN`
	- `VERCEL_ORG_ID`
	- `VERCEL_PROJECT_ID`
- Optional backend SSH deployment secrets:
	- `BACKEND_DEPLOY_SSH_HOST`
	- `BACKEND_DEPLOY_SSH_USER`
	- `BACKEND_DEPLOY_SSH_KEY`
	- `BACKEND_DEPLOY_PATH`

## Core RPC Endpoints
- `create_match_room`
- `join_match_room`
- `find_match`
- `submit_move`
- `get_match_state`
- `rematch_request`
- `set_username`
- `get_leaderboard`
- `get_match_history`

## Environment Variables
- `VITE_NAKAMA_HOST`
- `VITE_NAKAMA_PORT`
- `VITE_NAKAMA_SSL`
- `VITE_SERVER_KEY`
- `POSTGRES_PASSWORD`
- `NAKAMA_TEST_MODE`

## Testing
### Manual Multiplayer Test
1. Open two browser tabs.
2. Set usernames in both tabs.
3. Create room in tab A.
4. Join from tab B (or press Play Online in both tabs).
5. Validate move sync, rejection of invalid moves, result consistency, rematch, and reconnect.

### Automated
Run from `tic-tac-toe-game`:

```bash
npm run build
docker compose up -d
npm run test:e2e
npm --workspace frontend run test:playwright
```

## Feature Checklist
- [x] Server-authoritative move and turn validation
- [x] Win/draw detection
- [x] Turn timer and timeout resolution
- [x] Real-time state broadcast
- [x] Room create/join and auto matchmaking
- [x] Reconnect support
- [x] Leaderboard and match history persistence
- [x] Concurrent room isolation checks

## Security Notes
- Do not commit real secrets.
- Use environment variables for sensitive values.
- Rotate keys/passwords before production deployment.

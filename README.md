# LockPrime

LockPrime is a savings app that helps users commit money by locking it in vaults until a chosen unlock date. Deposits are allowed anytime; withdrawals are blocked until the vault unlocks.

This repository is a monorepo with a React frontend and an Express/Prisma backend. Balances are simulated in PostgreSQL — no real payments yet.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express, JWT auth |
| Database | PostgreSQL, Prisma ORM |

## Project structure

```
LockPrime/
├── locked-vault-client/   # React SPA (port 5173)
├── locked-vault-server/   # Express API (port 5000)
├── ARCHITECTURE.md        # Technical architecture
└── PROJECT_VISION.md      # Product vision and rules
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- PostgreSQL (local, [Neon](https://neon.tech), or similar)

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/emmanuelboop/LockPrime.git
cd LockPrime
```

### 2. Backend setup

```bash
cd locked-vault-server
npm install
cp .env.example .env
```

Edit `.env` and set:

- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — a long random secret string

Apply database migrations and start the API:

```bash
npx prisma migrate deploy
npm run dev
```

The server runs at `http://localhost:5000`.

### 3. Frontend setup

In a second terminal:

```bash
cd locked-vault-client
npm install
npm run dev
```

The client runs at `http://localhost:5173` and expects the API at `http://localhost:5000`.

## Running tests

From `locked-vault-server/`:

```bash
# All tests (requires a reachable PostgreSQL database)
npm test

# Unit tests only (no database required)
npm run test:unit

# Check database connectivity
npm run test:db
```

For local development, consider a separate test database:

```bash
cp .env.test.example .env.test
# Set TEST_DATABASE_URL in .env.test
```

Integration tests wipe all users, vaults, and transactions in the target database between runs.

## Environment variables

### Server (`locked-vault-server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | API port (default `5000`) |
| `TEST_DATABASE_URL` | No | Separate DB for tests (via `.env.test`) |

See `.env.example` and `.env.test.example` in `locked-vault-server/`.

## Documentation

- [PROJECT_VISION.md](./PROJECT_VISION.md) — product goals and development philosophy
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, security rules, and data model

## License

Private project — all rights reserved unless stated otherwise.

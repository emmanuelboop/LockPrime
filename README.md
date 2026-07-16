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
# Unit tests only (no database required)
npm run test:unit

# Integration tests (requires a dedicated test database)
npm run test:integration

# All tests
npm test

# Verify test database connectivity
npm run test:db
```

### Dedicated test database (recommended)

Integration tests **delete all users, vaults, and transactions** before each test. Use a separate database so your dev data and login sessions stay intact.

**Option A — Neon branch (easiest if you already use Neon)**

1. In the [Neon console](https://console.neon.tech), open your project
2. Create a branch (e.g. `test`)
3. Copy the branch connection string

**Option B — Local PostgreSQL**

```bash
createdb lockprime_test
# Use: postgresql://USER:PASSWORD@localhost:5432/lockprime_test
```

**Configure and prepare**

```bash
cd locked-vault-server
cp .env.test.example .env.test
# Edit .env.test and set TEST_DATABASE_URL

npm run test:prepare   # apply migrations to the test database
npm run test:db        # confirm connectivity
npm test
```

If `TEST_DATABASE_URL` is not set, integration tests **refuse to run** against your `.env` development database (unless you explicitly set `ALLOW_DEV_DATABASE_TESTS=true` in `.env.test`).

GitHub Actions uses an isolated Postgres container — no extra setup needed in CI.

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

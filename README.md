# Sweety – Blood Glucose Tracker

A MERN + PostgreSQL web app where a diabetes patient records up to 4 blood glucose
readings per day (Morning fasting, After breakfast, After lunch, After dinner) and
views daily, month-to-date and monthly reports.

## Features

- Sign up / log in (passwords hashed with bcrypt, JWT auth)
- Add, edit, delete glucose readings with full validation
- One reading per slot per day; max 4 readings per day; no future dates
- Reports: highest, lowest, average (1 decimal), reading count, per-slot daily list
- Line chart of readings (Recharts) and pagination support on `GET /api/readings`
- Docker Compose setup for PostgreSQL + API

## Project structure

```
sweety/
├── server/          # Express + PostgreSQL API
│   ├── src/
│   │   ├── db/      # pool, schema init, seed script
│   │   ├── middleware/auth.js
│   │   ├── routes/  # auth, readings, reports
│   │   └── utils/validation.js
│   └── tests/       # node:test unit tests
└── client/          # React + Vite + Tailwind frontend
```

## Setup

### 1. Database

You need a running PostgreSQL instance. Either:

**Option A – Docker (recommended):**

```bash
docker compose up -d db
```

**Option B – local PostgreSQL:** create a database named `sweety` (or set `DB_NAME`).

### 2. Environment

```bash
cp .env.example server/.env
```

Edit `server/.env` if your DB credentials differ. Defaults match the docker-compose
setup (`postgres`/`postgres`, db `sweety`).

### 3. Install & run

```bash
npm run install:all

# terminal 1 – API (http://localhost:5000)
npm run dev:server

# terminal 2 – client (http://localhost:5173, proxies /api to :5000)
npm run dev:client
```

Tables are created automatically on server start.

### 4. Seed demo data

```bash
npm run seed
```

Creates `demo@sweety.app` / `password123` with ~2 weeks of sample readings.

## Tests

```bash
npm test
```

- `server/tests/` – validation unit tests (`node --test`)
- `client/src/components/ReadingForm.test.jsx` – form validation tests (Vitest + Testing Library)

## API overview

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| POST   | /api/auth/signup      | Register                           |
| POST   | /api/auth/login       | Login, returns JWT                 |
| GET    | /api/readings         | List readings (`?date=&page=&limit=`) |
| POST   | /api/readings         | Add reading                        |
| PUT    | /api/readings/:id     | Edit reading                       |
| DELETE | /api/readings/:id     | Delete reading                     |
| GET    | /api/reports          | Report (`?date=&type=daily\|mtd\|monthly`) |

All `/api/readings` and `/api/reports` routes require `Authorization: Bearer <token>`.

## Notes / assumptions

- **Time slot** is stored as one of the 4 fixed labels; uniqueness is enforced by a
  DB constraint `(user_id, date, slot)` and checked in the API for friendly errors.
- **"Monthly" report** means the whole *previous* calendar month relative to the
  selected date, per the spec.
- **Average** is rounded to 1 decimal place.
- Dates are compared in the server's local timezone; the client sends `YYYY-MM-DD`.
- With more time I would add: Redis caching for reports, BullMQ reminder job,
  doctor/patient roles, refresh tokens, and E2E tests (Playwright).

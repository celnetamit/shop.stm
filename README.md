# STM Journals Shop Clone (Next.js + PostgreSQL)

This project clones content from `https://shop.stmjournals.com` into a Next.js website and caches pages in PostgreSQL.

## Stack

- Next.js (App Router)
- Backend API routes in Next.js
- Prisma ORM
- PostgreSQL

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and apply schema:

```bash
npx prisma generate
npx prisma db push
```

5. Run app:

```bash
npm run dev
```

## Authentication (JWT + Google OAuth)

This app includes:

- Email/password register + login
- Google OAuth login
- JWT cookie-based sessions
- `USER` and `ADMIN` roles

Environment variables:

```bash
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Role-protected routes:

- `/account` requires authenticated `USER` or `ADMIN`
- `/admin` requires authenticated `ADMIN`
- `/api/sync` requires authenticated `ADMIN`

To promote a user to admin, update their `role` in the `User` table to `ADMIN`.

## Sync endpoint

Refresh/cache a path manually:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "content-type: application/json" \
  -d '{"path":"/", "forceRefresh": true}'
```

## Notes

- This clone fetches source pages on-demand and stores rewritten HTML in PostgreSQL.
- Scripts from WordPress are removed intentionally for stability/security in React rendering.

# STM Journals Shop Clone (Next.js + PostgreSQL)

This project clones content from `https://shop.stmjournals.com` into a Next.js website and caches pages in PostgreSQL.

## Stack

- Next.js (App Router)
- Backend API routes in Next.js
- Prisma ORM
- PostgreSQL

## Local Setup

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

## Coolify Deployment (App + Coolify Postgres)

This repository is deployment-ready for Coolify using the included `Dockerfile`.

### 1. Create PostgreSQL in Coolify

1. In Coolify, create a new **PostgreSQL** resource.
2. Note these values from the generated connection details:
- host
- port
- database
- username
- password

### 2. Create Application in Coolify

1. Create new **Application** from Git repo:
- `https://github.com/celnetamit/shop.stm.git`
- Branch: `main`
2. Build Pack: **Dockerfile**
3. Port: `3000`

### 3. Configure Environment Variables in Coolify

Set these in the app environment:

- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=<long-random-secret>`
- `NEXT_PUBLIC_APP_URL=https://<your-domain>`
- `GOOGLE_CLIENT_ID=<google-client-id>`
- `GOOGLE_CLIENT_SECRET=<google-client-secret>`
- `ADMIN_EMAILS=manish@celnet.in,vivek.verma@panoptical.org`
- `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?schema=public`

### 4. Connect Domain + SSL

1. Add your domain/subdomain in Coolify for this app.
2. Enable SSL/HTTPS (Let’s Encrypt).
3. Ensure `NEXT_PUBLIC_APP_URL` exactly matches your https domain.

### 5. Deploy

Trigger deploy from Coolify UI.

At container startup, app runs:

- `prisma db push` (keeps schema in sync)
- `next start`

### 6. Health Check

Use endpoint:

- `/api/health`

Expected response:

```json
{ "ok": true, "status": "healthy", "service": "stm-shop" }
```

### 7. Google OAuth Callback URLs

In Google Cloud Console OAuth client, add callback URL:

- `https://<your-domain>/api/auth/google/callback`

(Keep local callback too if needed for local dev.)

## Authentication (JWT + Google OAuth)

This app includes:

- Email/password register + login
- Google OAuth login
- JWT cookie-based sessions
- `USER` and `ADMIN` roles

Role-protected routes:

- `/account` requires authenticated `USER` or `ADMIN`
- `/admin` requires authenticated `ADMIN`
- `/api/sync` requires authenticated `ADMIN`

## Sync endpoint

Refresh/cache a path manually:

```bash
curl -X POST http://localhost:3000/api/sync \\
  -H "content-type: application/json" \\
  -d '{"path":"/", "forceRefresh": true}'
```

## Notes

- This clone fetches source pages on-demand and stores rewritten HTML in PostgreSQL.
- Scripts from WordPress are removed intentionally for stability/security in React rendering.

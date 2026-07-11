# SplitWise — Shared Expense Tracker

A full-stack shared expense tracking app built for the internship assignment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | Zustand (auth), TanStack Query (server data) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Deployment | Vercel (frontend) + Railway (backend) + Supabase (DB) |

## Prerequisites

- Node.js 18+
- PostgreSQL (or a Supabase project)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd expense-tracker
npm install
```

### 2. Environment variables

```bash
cd apps/server
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 3. Database setup

```bash
cd apps/server
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations
```

### 4. Run locally

```bash
# From root — starts both server (port 3001) and client (port 5173)
npm run dev
```

### 5. Import data

1. Go to your group → "Import CSV"
2. Upload `expenses_export.xlsx`
3. Review anomalies (all 14 are detected automatically)
4. Choose a resolution for each and confirm

## AI Used

Primary: **Antigravity (Google DeepMind)** — used as pair-programming assistant throughout development.

See `AI_USAGE.md` for detailed usage log.

## Deployment

- Frontend: [Vercel](https://vercel.com) — set `VITE_API_URL` to your backend URL
- Backend: [Railway](https://railway.app) — set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`
- DB: [Supabase](https://supabase.com) — free PostgreSQL with connection pooler

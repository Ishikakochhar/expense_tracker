# The Hearth — Shared Expense Tracker

A full-stack shared expense tracking app built for the internship assignment.

![The Hearth Logo](./logo.png)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts |
| State | Zustand (auth + i18n), TanStack Query (server data) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| FX Rates | open.er-api.com (live, 1-hr cached, fallback to ₹83.5) |
| Deployment | Vercel (frontend) + Railway (backend) + Supabase (DB) |

## Features

- **Groups**: Create shared expense groups, invite members via QR code or invite link.
- **Unregistered member claiming**: When a new user joins via invite code, they can claim an existing member slot from CSV-imported data.
- **Import wizard**: Upload `.xlsx` / `.csv`, automatically detect all 14 anomalies, review & resolve before committing.
- **Balance engine**: Greedy two-pointer debt minimization — calculates the minimum number of payments to settle all debts.
- **Global dashboard**: Donut chart showing expenses per group, real-time balance summary, and one-click settle-up for any person.
- **Settlements**: Record payments with payment mode (Cash, UPI, Bank Transfer, etc.) and an optional note.
- **Activity log**: Global feed filtered to your personal transactions; full group-level activity log inside each group.
- **Settings**: Dark/light mode, language switching (English / Hindi), profile management.

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
3. Review all detected anomalies (all 14 are detected automatically)
4. Choose a resolution for each (skip, fix, or keep) and confirm

### 6. Track & Settle

1. Your **Dashboard** shows an at-a-glance donut chart of spending by group.
2. The **Settlement Plan** section lists who you owe and who owes you — click any row to open the Settle Up modal.
3. The Settle Up modal lets you record the exact amount, choose which group it belongs to, and note the payment mode (UPI, Cash, etc.).
4. Inside any **Group**, the "Activity" tab shows a complete timeline of every expense and settlement in the group.

## AI Used

Primary: **Antigravity (Google DeepMind)** — used as pair-programming assistant throughout development.

Models used:
- **Gemini 3.1 Pro** — architecture, scaffolding, core feature development
- **Claude Sonnet 4.6** — iterative UI polish, bug-fixing, final refinements

See `AI_USAGE.md` for the detailed prompt log.

## Deployment

- Frontend: [Vercel](https://vercel.com) — set `VITE_API_URL` to your backend URL
- Backend: [Railway](https://railway.app) — set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`
- DB: [Supabase](https://supabase.com) — free PostgreSQL with connection pooler

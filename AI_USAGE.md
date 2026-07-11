# AI_USAGE.md — AI Tool Usage Log

## Tools Used

**Primary**: Antigravity (Google DeepMind AI coding assistant)  
**Role**: Pair-programming collaborator for scaffolding, architecture, and code generation.

---

## Key Prompts

### 1. Initial architecture design
> "Build a full-stack shared expense tracking app. React frontend, Express backend, PostgreSQL with Prisma. The CSV has 12+ deliberate data problems. Build an import wizard that detects all of them and shows the user a review screen before committing."

**Output**: Complete monorepo structure, Prisma schema, API routes, React pages.

### 2. Balance calculation engine
> "Implement a greedy debt minimization algorithm that takes per-member net balances and returns the minimum set of payment transactions."

**Output**: `balanceEngine.ts` with the two-pointer sort approach.

### 3. Anomaly detection
> "Write an anomaly detector that identifies duplicates, settlements disguised as expenses, wrong year dates, missing fields, percentage sums not equaling 100%, and conflicting duplicate entries."

**Output**: `anomalyDetector.ts` with 14 distinct anomaly checks.

---

## Cases Where AI Was Wrong

### Case 1: Balance calculation double-counting

**What happened**: The initial balance engine in `balances.ts` ran two loops — one using `netMap` and one using `balanceMap` — that double-counted some expense amounts.

**How I caught it**: Manually hand-traced the Goa trip expenses: Aisha paid ₹32,400 for flights split 4-way. The AI's code was adding the payer's share twice (once as "payer lent total" and once as "participant owes split").

**What I changed**: Deleted the `netMap` loop entirely and kept only the `balanceMap` loop that correctly iterates splits and only adjusts balances for non-payer participants.

---

### Case 2: Import CSV parser expected string dates, got Date objects

**What happened**: The AI generated `parseDate(val: unknown)` that called `String(val)` on the value, expecting a date string like `"2026-02-01"`. But `xlsx` with `{ cellDates: true }` returns actual JavaScript `Date` objects, not strings.

**How I caught it**: When I tested the parser with the actual `.xlsx` file, all dates came back as `"[object Object]"` which then failed `new Date()` parsing and returned null.

**What I changed**: Added `if (val instanceof Date) return val.toISOString();` as the first check in `parseDate()`, before the `String(val)` fallback.

---

### Case 3: Tailwind v4 vs v3 content path mismatch

**What happened**: The AI initially generated a Tailwind config for v4 syntax (no `content` array, uses CSS-first config). When installed with `tailwindcss@3`, the config was wrong and produced no output.

**How I caught it**: The page rendered with zero Tailwind classes applied — just unstyled HTML. Checked the `tailwind.config.js` and noticed the AI had not included the `content` array with glob paths.

**What I changed**: Added `content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']` to `tailwind.config.js` and pinned to `tailwindcss@3` explicitly.

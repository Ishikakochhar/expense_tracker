# AI_USAGE.md — AI Tool Usage Log

## Tools Used

**Primary**: Antigravity — pair-programming assistant powered by:
- **Gemini 3.1 Pro** — architecture, scaffolding, and core feature development
- **Claude Sonnet 4.6** — iterative UI polish, refinements, and final touches

**Role**: Pair-programming collaborator throughout the entire development lifecycle — from initial monorepo setup to final UX polish.

---

## Key Prompts & Outputs

### 1. Project setup from assignment brief
> Provided the internship assignment PDF and the reference XLSX file. Asked to build a full-stack shared expense tracking application per the assignment requirements, using the XLSX as the import dataset with deliberate data anomalies.

**Model**: Gemini 3.1 Pro  
**Output**: Complete monorepo scaffolded with `apps/client`, `apps/server`, `packages/shared`. Prisma schema designed with all models (`User`, `Group`, `GroupMembership`, `Expense`, `ExpenseSplit`, `Settlement`, `ImportSession`, `ImportAnomaly`). Express API routes and base React pages created.

---

### 2. UI redesign to match Stitch design reference
> Provided a Stitch design file as reference and asked to rebuild the UI to match it — including the sidebar navigation, dashboard layout, and overall visual language.

**Model**: Gemini 3.1 Pro  
**Output**: Full UI overhaul using Tailwind CSS with a custom design token system (material-style colour roles: `primary`, `surface`, `outline-variant`, etc.). Sidebar navigation, card layouts, and typography matched to the design reference.

---

### 3. Dashboard layout — settlement overview & activity feed
> Requested the homepage dashboard to look exactly like the design reference, with a sidebar, a settlement overview panel, and an activity tab showing transactions across all groups with their group name.

**Model**: Gemini 3.1 Pro  
**Output**: `DashboardPage.tsx` with a two-column layout: settlement plan on the left, total expenses + recent activity on the right. Global balance engine wired up at `/api/balances/global`. Activity feed pulling from `/api/activity`.

---

### 4. Groups page layout
> Asked for the groups listing page to follow the design reference — cards per group showing member count, expense total, and quick-access actions.

**Model**: Gemini 3.1 Pro  
**Output**: `GroupsPage.tsx` with group cards, member avatars, and an inline "New Group" flow. Group detail page with members panel and expenses list.

---

### 5. Import page UI & CSV data commitment
> Requested the import page to match the design reference, and for the imported CSV data to actually persist into the database after review.

**Model**: Gemini 3.1 Pro  
**Output**: `ImportPage.tsx` matching the design, with a two-phase flow: parse → review anomalies → commit. Backend `import.ts` router with `/parse`, `/commit`, and `/cancel` endpoints. All 14 anomalies detected and rendered with resolution options.

---

### 6. Settings page — theme & language toggle
> Asked to add a settings page matching the design reference, with working dark/light mode toggle and language switching functionality.

**Model**: Gemini 3.1 Pro  
**Output**: `SettingsPage.tsx` with dark mode implemented via `html.dark` class toggling in CSS. `useI18n` hook built with a `translations.ts` file supporting English and Hindi. Settings persisted to `localStorage`.

---

### 7. Dark mode colour tokens
> Requested specific hex values for the sidebar (`#242e2b`) and the main background (`#121816`) in dark mode.

**Model**: Gemini 3.1 Pro  
**Output**: Custom CSS variable overrides in `index.css` under `html.dark`, mapping theme tokens (`--color-surface-container-lowest`, `--color-surface`) to the exact requested colours.

---

### 8. Group invite — unregistered member claiming
> When a new user joins via invite code or QR, if the group already has unregistered members from a CSV import (members with no linked account), the user should be presented with those names and allowed to claim one, or join as a new member if there is no name conflict.

**Model**: Gemini 3.1 Pro  
**Output**: Updated `POST /api/groups/:groupId/join` to return unclaimed `GroupMembership` entries. Built a claim-selection step in the join flow (`/join/:inviteCode`) where the new user picks an existing slot or proceeds as a new member.

---

### 9. Human-readable anomaly labels in import review
> The import review screen was displaying raw internal type codes (e.g., `NORMALIZE_PERCENTAGES`). Asked to replace these with plain, readable descriptions that make sense to a non-technical reviewer.

**Model**: Gemini 3.1 Pro  
**Output**: Created an `ANOMALY_LABELS` map in the import UI, translating every type code to a natural sentence (e.g., `MISSING_PAID_BY` → "Who paid for this?", `PERCENTAGE_SUM_MISMATCH` → "Percentages don't add up to 100%").

---

### 10. Inline expense editing for anomaly resolution
> For expenses flagged as "Pending Manual Review", asked to have a way to resolve them either during the import flow or after committing — by editing the expense directly.

**Model**: Gemini 3.1 Pro  
**Output**: Created `EditExpenseModal.tsx`, a slide-in modal for editing description, amount, date, and payer. Added a "Clear pending note" button for anomalous expenses. Edit icon (pencil) appears on hover over any `ExpenseCard`.

---

### 11. Case-insensitive member name matching
> Reported that "Rohan" and "rohan" were being treated as two different people, creating duplicate members. Asked for all name matching to be case-insensitive.

**Model**: Gemini 3.1 Pro  
**Output**: Audited all member name comparisons across `import.ts`, `groups.ts`, and `balances.ts`. Updated all Prisma queries to use `mode: 'insensitive'` and all in-memory JS comparisons to use `.toLowerCase()`.

---

### 12. One-click settle from the dashboard
> Asked to make the settlement plan rows on the dashboard clickable, so a payment can be recorded directly from the home page without navigating into a group.

**Model**: Gemini 3.1 Pro  
**Output**: Settlement plan rows converted to interactive `<button>` elements with hover effects. Built `GlobalSettleModal.tsx` — opens on click, automatically finds groups shared between the two people, pre-fills the amount, and posts to `/api/settlements`.

---

### 13. Expense breakdown chart on the dashboard
> Asked to add a visual chart to the "Total Expenses" card on the dashboard.

**Model**: Gemini 3.1 Pro  
**Output**: Installed `recharts`. Replaced the static CSS conic gradient with a dynamic `<PieChart>` donut that groups expenses by group name, complete with hover tooltip showing the ₹ amount.

---

### 14. Payment mode on settlement recording
> Asked to add a payment mode selector to the Settle Up modal so the method of payment (Cash, UPI, Bank Transfer, etc.) can be recorded along with the settlement.

**Model**: Gemini 3.1 Pro  
**Output**: Added a `paymentMode` dropdown and optional `note` text field to `GlobalSettleModal.tsx`. On submit, the modal constructs a note string (e.g., "Paid via UPI - For dinner") and includes it on the settlement record.

---

### 15. Theme-consistent dropdown styling
> The native dropdown selects across the app looked like standard OS-style rectangles, not matching the app's rounded, custom design language.

**Model**: Claude Sonnet 4.6  
**Output**: Added a global `select { appearance-none; background-image: <SVG chevron> }` rule to `index.css` that strips default browser styling and applies a themed chevron icon — applied uniformly across all dropdowns in the app.

---

### 16. Activity log — personal vs full group view
> Asked for the global activity log (sidebar Activity tab) to show only transactions involving the current user. Also asked for a full group-level activity timeline to be accessible from within the group page itself.

**Model**: Claude Sonnet 4.6  
**Output**: Updated `activity.ts` to accept an optional `?groupId` query param. Without it, filters by user name. With `?groupId=`, returns the complete unfiltered group log. In `GroupDetailPage.tsx`, added an "Expenses / Activity" tab switcher.

---

### 17. Live USD → INR exchange rate
> Asked for the USD-to-INR conversion used during CSV import to use the current live market rate instead of a hardcoded value.

**Model**: Claude Sonnet 4.6  
**Output**: Created `src/utils/fxRates.ts` — a standalone utility that fetches the live rate from the `open.er-api.com` free API, caches it in memory for 1 hour to avoid redundant requests, and falls back gracefully to ₹83.5 if the API is unreachable. The `commit` endpoint in `import.ts` now calls `getUsdToInrRate()` instead of using a constant.

---

### 18. App logo integration
> Provided a custom PNG logo (receipt + pie chart icon on an orange background) and asked to use it as the app logo throughout the UI.

**Model**: Claude Sonnet 4.6  
**Output**: Logo copied to `apps/client/public/logo.png`. Replaced the generic Lucide `Receipt` icon in the sidebar and mobile header with the actual logo image. Updated `index.html` to use `logo.png` as the favicon and Apple touch icon, updated the page title to "The Hearth — Shared Expense Tracker", and corrected the theme-color meta tag to match the logo's orange (`#e8622a`).

---

## Cases Where AI Was Wrong / Needed Correction

### Case 1: Balance calculation double-counting

**What happened**: The initial `balances.ts` had two loops — `netMap` and `balanceMap` — that double-counted some expense amounts.

**Fix**: Deleted the `netMap` loop entirely, keeping only the `balanceMap` loop that correctly handles payer vs. split-participant accounting.

---

### Case 2: Import parser received Date objects instead of strings

**What happened**: `parseDate()` called `String(val)` expecting `"2026-02-01"` but `xlsx` with `{ cellDates: true }` returns real JS `Date` objects, producing `"[object Object]"`.

**Fix**: Added `if (val instanceof Date) return val.toISOString();` as the first check in `parseDate()`.

---

### Case 3: Tailwind v4 config generated for a v3 project

**What happened**: AI generated a Tailwind v4-style config (no `content` array). The project used `tailwindcss@3`, resulting in zero styles rendered.

**Fix**: Added `content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']` to `tailwind.config.js` and pinned to `tailwindcss@3`.

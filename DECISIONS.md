# DECISIONS.md — Engineering Decision Log

## D1: Monorepo with npm Workspaces

**Decision**: Single repo with `apps/client`, `apps/server`, `packages/shared`.

**Options considered**:
- Separate repos (two GitHub repos)
- Monorepo with Turborepo
- Monorepo with plain npm workspaces ← chosen

**Reason**: npm workspaces give shared types without build overhead. Turborepo is overkill for a 2-person app. A single repo means one `git log` that tells the full story.

---

## D2: PostgreSQL + Prisma (no NoSQL)

**Decision**: PostgreSQL with Prisma ORM. Assignment explicitly requires a relational DB.

**Options considered**:
- MongoDB (document DB, rejected)
- SQLite (easy local but no hosted free tier with good performance)
- PostgreSQL via Supabase ← chosen

**Reason**: Group membership is inherently relational (many-to-many with time ranges). Balance calculations require joins. Prisma gives type-safe queries and migration history.

---

## D3: JWT Auth (no session/cookie)

**Decision**: Stateless JWT stored in Zustand + localStorage.

**Options considered**:
- Server-side sessions (requires Redis/DB overhead)
- HTTPOnly cookies (better security, harder to set up cross-origin)
- JWT in localStorage ← chosen for simplicity in this context

**Reason**: This is an internal-use app, not a public banking product. JWT in localStorage is acceptable. In production, would move to HTTPOnly cookies.

---

## D4: USD → INR Conversion Rate

**Decision**: Fixed rate of 83.5 INR/USD stored per expense at time of import.

**Options considered**:
- Live FX API (requires paid key, introduces network dependency)
- User-configurable rate per expense ← chosen
- Fixed global rate

**Reason**: Historical FX data is behind paywalls. For a group flatmate app, the user who entered the USD expense knew the rate at the time. The rate is stored on the `Expense` record, so it's auditable and explainable. This is documented in the import UI.

---

## D5: Rounding Rule for Split Amounts

**Decision**: Floor to 2 decimal places per split; add remainder to the **first** member (the payer).

**Options considered**:
- Round each split (can lose/gain 1 paisa)
- Floor and add remainder to payer ← chosen
- Round and ignore remainder

**Reason**: The payer paid the full amount. The error from rounding is always ≤ n×0.01 INR (n = number of members). Giving the rounding residual to the payer is the most natural assignment — they spent the most, they absorb rounding.

---

## D6: Debt Minimization Algorithm

**Decision**: Greedy two-pointer on sorted creditors/debtors.

**Options considered**:
- No minimization (raw pair balances)
- Greedy sort-and-sweep ← chosen
- NP-optimal matching (intractable for large n)

**Reason**: For n ≤ 10 members (typical flatmate scenario), greedy gives the minimum number of transactions in O(n log n). The optimal solution for the minimum set problem is NP-hard; greedy is correct for non-adversarial inputs.

---

## D7: Settlement Detection Heuristic

**Decision**: A row is flagged as a settlement if `split_type` is null AND the description matches `/paid.*back|settlement|return/i`.

**Options considered**:
- Only check `split_type === null`
- Only check description
- Both conditions ← chosen

**Reason**: Split_type alone is insufficient (some expenses also had null split_type in the CSV). Combined with description pattern it's precise enough for the known dataset.

---

## D8: Import as XLSX (not CSV rename)

**Decision**: Use the `xlsx` npm package to parse both XLSX and CSV directly.

**Options considered**:
- Ask user to convert to CSV first
- Parse XLSX directly ← chosen

**Reason**: The assignment says "importing expenses_export.csv" but the actual file provided is `.xlsx`. Editing the file before import is not allowed. Parsing XLSX directly is the correct approach and handles both formats transparently.

---

## D9: Conflicting Duplicate Resolution

**Decision**: Keep the first entry (lower row index) by default for conflicting duplicates.

**Options considered**:
- Keep the larger amount (Rohan's version of Thalassa dinner is ₹2450 vs Aisha's ₹2400)
- Keep the payer with more authority
- Keep first entry ← chosen default, user can override

**Reason**: "First logged = most likely correct" is a simple, auditable rule. The UI always shows both entries and lets the user override.

---

## D10: Temporal Membership

**Decision**: `GroupMembership.leftAt` nullable datetime. Balance calculations use all expenses regardless of membership; stale-member flag is an import-time anomaly, not a hard block.

**Options considered**:
- Hard-block any expense dated after a member's `leftAt`
- Soft-flag as anomaly ← chosen

**Reason**: Sam's request is valid (March electricity shouldn't affect him), but implementing hard blocks on historical data import would reject legitimate rows. The stale-member anomaly is surfaced to the user who can then remove the member from the split manually.

---

## D11: Case-Insensitive Name Matching Everywhere

**Decision**: All member name lookups use Prisma's `mode: 'insensitive'` and all in-memory comparisons use `.toLowerCase()`.

**Options considered**:
- Normalize to lowercase on write (would break display names)
- Case-sensitive exact match (leads to duplicate members like "Rohan" and "rohan")
- Case-insensitive read-time matching ← chosen

**Reason**: A user reported that "rohan" created a brand new person separate from "Rohan". This is a data integrity issue — the display name is preserved as typed but lookups are done case-insensitively so the same person is never duplicated.

---

## D12: Unregistered Member Claiming at Group Join

**Decision**: When a new user joins a group via invite code, show them a list of unclaimed `GroupMembership` slots (non-null `displayName`, null `userId`) and let them claim one or register fresh.

**Options considered**:
- Auto-match by email (no email on memberships, not feasible)
- Always create a new membership ← rejected (creates phantoms)
- Offer claim UI on join flow ← chosen

**Reason**: Groups imported from CSV have many members who aren't registered users. Without this flow, a user named "Priya" who signs up can't associate herself with the "Priya" already in the group's expense history. The claim flow solves this in one step.

---

## D13: Global Settlement from Dashboard (Cross-Group)

**Decision**: Settlement records are still scoped to a single group, but the UI for initiating a settlement can live on the global dashboard.

**Options considered**:
- Force users to navigate into each group to settle up
- Build a "global settlement" that creates multi-group records ← rejected (too complex)
- Global trigger, but resolve to one group ← chosen

**Reason**: The user said *"also make me be able to click any one of these from the home page only to settle"*. The `GlobalSettleModal` finds all groups shared between two people and asks the user to confirm which one the payment belongs to. One click from the dashboard, no context switching.

---

## D14: Native `<select>` Styled with CSS, Not a Custom Component

**Decision**: Use native `<select>` with `appearance-none` and an inline SVG chevron via `background-image` in global CSS.

**Options considered**:
- Headless UI / Radix Select (full accessibility, but adds bundle weight and complexity)
- Custom React dropdown with Portal (flexible but lots of keyboard/a11y code to write)
- Native `<select>` + global CSS override ← chosen

**Reason**: User flagged: *"why are the options menu standard rectangle dropdown make them match our theme"*. Native selects are fully accessible and mobile-friendly by default. Stripping default appearance with global CSS gives full visual control and applies instantly across every dropdown in the app with ~6 lines of CSS.

---

## D15: Activity Log Filtering — Personal vs Group-Level

**Decision**: The global `/api/activity` feed filters to only items involving the current user by name. Passing `?groupId=` returns the full unfiltered log for that group.

**Options considered**:
- Always return all activity across all groups (too noisy)
- Always filter by user (loses group-level audit trail)
- Filter by user globally; scope to group when `groupId` is provided ← chosen

**Reason**: User said *"in this activity log only show logs related to you, and show the complete log of the group, somewhere within the group only."* One backend endpoint handles both cases. The `GroupDetailPage` has an "Activity" tab that calls the endpoint with `?groupId=` to show the full group timeline.

---

## D16: Live FX Rate via External API (Cached)

**Decision**: Fetch the live USD → INR rate from `open.er-api.com` at import time, cached in memory for 1 hour.

**Options considered**:
- Hardcoded fixed rate (simple, but stale — was using ₹83.5 while real rate was ₹95.5)
- User-entered rate per expense
- Live API with in-process cache ← chosen

**Reason**: The hardcoded rate had drifted significantly from reality. A live fetch ensures accuracy. The 1-hour in-memory cache prevents hammering the free-tier API on every import row. A 5-second timeout + graceful fallback ensures the import never fails just because the FX service is down.

---

## D17: Custom PNG Logo Over Lucide Icon

**Decision**: Use the provided `logo.png` image in the sidebar and mobile header, and as the browser favicon / Apple touch icon.

**Options considered**:
- Keep Lucide `Receipt` icon as the brand mark
- Use the PNG logo everywhere ← chosen

**Reason**: A real logo communicates product identity. The PNG is served from `public/` so it's always available at `/logo.png` with zero import overhead. The theme-color meta tag was updated to `#e8622a` to match the logo's orange on mobile browsers.

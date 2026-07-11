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

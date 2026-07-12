# SCOPE.md — Anomaly Log & Database Schema

## Database Schema

### Entity Relationship Diagram

```
User ─────────────────── GroupMembership ─── Group
                              │                │
                              │              Expense ── ExpenseSplit
                              │                │
                        Settlement ──────────────
                              │
                        ImportSession ── ImportAnomaly
```

### Tables

| Table | Key Fields |
|-------|-----------|
| `User` | id, name, email, passwordHash |
| `Group` | id, name, defaultCurrency, inviteCode |
| `GroupMembership` | id, groupId, userId, displayName, **joinedAt, leftAt** |
| `Expense` | id, groupId, description, amount, currency, **fxRate, amountInr**, paidByName, date, splitType, notes, isRefund |
| `ExpenseSplit` | id, expenseId, memberName, amount, shareValue, percentage |
| `Settlement` | id, groupId, fromMemberName, toMemberName, amount, amountInr, **note** |
| `ImportSession` | id, groupId, filename, status |
| `ImportAnomaly` | id, importSessionId, rowIndex, anomalyType, message, resolution, rowData |

**Key design notes**:
- `GroupMembership.leftAt` enables temporal membership — Sam's April join date and Meera's March leave date are stored and used to flag stale-member anomalies.
- `GroupMembership.userId` is nullable — a member without a linked `User` is an "unclaimed" slot from a CSV import that can be claimed when the real person joins via invite.
- `Group.inviteCode` is a short alphanumeric code used for QR and link-based joining.
- `Settlement.note` stores payment mode and optional description (e.g., "Paid via UPI - For dinner").

---

## Anomaly Log & Resolution

All 14 anomalies detected automatically during the import of `expenses_export.xlsx`. Each is surfaced to the user on a review screen before commit. Users can resolve them inline via the import UI or later using the **Edit Expense** feature (pencil icon on any expense card).

The import UI replaces all raw anomaly type codes (e.g., `NORMALIZE_PERCENTAGES`) with plain English descriptions so the reviewing user immediately understands what the problem is.

| # | Row | Anomaly | Type | Default Handling |
|---|-----|---------|------|-----------------|
| 1 | 5 | "dinner - marina bites" is exact duplicate of row 4 (same date, payer Dev, amount ₹3200) | `DUPLICATE_EXPENSE` | Flagged; second entry skipped. User can override. |
| 2 | 13 | "Rohan paid Aisha back ₹5000" — split_type is null, description matches settlement pattern | `SETTLEMENT_AS_EXPENSE` | Converted to a `Settlement` record, not an expense. |
| 3 | 12 | "House cleaning supplies" — paid_by is empty/null | `MISSING_PAID_BY` | Flagged as Pending Manual Review. Cannot import without a payer — user must edit or skip. |
| 4 | 26 | "Airport cab" — date shows 2014-03-01, year clearly wrong | `WRONG_YEAR` | Suggested fix: set year to 2026. User can override. |
| 5 | 27 | "Groceries DMart" Mar 15 — currency field is null | `MISSING_CURRENCY` | Defaulted to INR, documented in expense notes. |
| 6 | 25 | "Parasailing refund" — amount is -$30 (negative) | `NEGATIVE_AMOUNT` | Treated as a refund/credit. `isRefund=true` set on the expense. |
| 7 | 30 | "Dinner order Swiggy" — amount is ₹0 | `ZERO_AMOUNT` | Flagged. Notes say "counted twice earlier". Default: skip. User can keep as ₹0. |
| 8 | 23–24 | Thalassa dinner — Aisha logged ₹2400, Rohan logged ₹2450, same date | `CONFLICTING_DUPLICATE` | Keep first (row 23, ₹2400) by default; second is flagged for skip. User chooses. |
| 9 | 14 | "Pizza Friday" — percentages: 30+30+30+20=110% (not 100%) | `PERCENTAGE_SUM_MISMATCH` | Displayed as "Percentages don't add up to 100%". Normalized by scale factor (each % ÷ 1.1). Documented in expense notes. |
| 10 | 35 | "Groceries BigBasket" Apr 2 — split_with includes Meera who left end of March | `STALE_MEMBER` | Flagged. Notes say "oops Meera still in the group list". User decides to remove or keep. |
| 11 | 21 | "Scooter rentals" — split_type=share with "Aisha 1; Rohan 2; Priya 1; Dev 2" | *(Valid)* | Parsed correctly as weighted shares. No flag. |
| 12 | 33 | "Deep cleaning service" — notes say "is this April 5 or May 4?" | `AMBIGUOUS_DATE` | Flagged. Date as stored (May 4) is used by default; user prompted to confirm. |
| 13 | 13 | Settlement row has null split_type | *(Part of anomaly #2)* | Handled as part of settlement detection logic. |
| 14 | 42 | "Furniture for common room" — split_type=equal but split_details also provided (shares) | `SPLIT_TYPE_CONFLICT` | `split_type` field is authoritative. Equal split used, split_details ignored. Flagged for awareness. |

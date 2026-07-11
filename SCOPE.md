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
| `Group` | id, name, defaultCurrency |
| `GroupMembership` | id, groupId, userId, displayName, **joinedAt, leftAt** |
| `Expense` | id, groupId, description, amount, currency, **fxRate, amountInr**, paidByName, date, splitType, isRefund |
| `ExpenseSplit` | id, expenseId, memberName, amount, shareValue, percentage |
| `Settlement` | id, groupId, fromMemberName, toMemberName, amount, amountInr |
| `ImportSession` | id, groupId, filename, status |
| `ImportAnomaly` | id, importSessionId, rowIndex, anomalyType, message, resolution, rowData |

**Key design decision**: `GroupMembership.leftAt` enables temporal membership — Sam's April join date and Meera's March leave date are stored and used to flag stale-member anomalies.

---

## Anomaly Log

All 14 anomalies identified in `expenses_export.xlsx`:

| # | Row | Anomaly | Type | Handling |
|---|-----|---------|------|----------|
| 1 | 5 | "dinner - marina bites" is exact duplicate of row 4 (same date, payer Dev, amount ₹3200) | `DUPLICATE_EXPENSE` | **Policy**: Flagged; second entry skipped by default. User can override. |
| 2 | 13 | "Rohan paid Aisha back ₹5000" — split_type is null, description matches settlement pattern | `SETTLEMENT_AS_EXPENSE` | **Policy**: Converted to a `Settlement` record, not an expense. |
| 3 | 12 | "House cleaning supplies" — paid_by is empty/null | `MISSING_PAID_BY` | **Policy**: Flagged as PENDING; user must decide or skip. Cannot import without a payer. |
| 4 | 26 | "Airport cab" — date shows 2014-03-01, year clearly wrong | `WRONG_YEAR` | **Policy**: Suggested fix is `FIX_DATE` → sets year to 2026. User can override. |
| 5 | 27 | "Groceries DMart" Mar 15 — currency field is null | `MISSING_CURRENCY` | **Policy**: Default to INR with user confirmation. Documented in notes on import. |
| 6 | 25 | "Parasailing refund" — amount is -$30 (negative) | `NEGATIVE_AMOUNT` | **Policy**: Treated as a refund/credit. `isRefund=true` set on the expense. Negative amounts are valid. |
| 7 | 30 | "Dinner order Swiggy" — amount is ₹0 | `ZERO_AMOUNT` | **Policy**: Flagged. Notes say "counted twice earlier". Default: skip. User can keep as ₹0. |
| 8 | 23–24 | Thalassa dinner — Aisha logged ₹2400, Rohan logged ₹2450, same date | `CONFLICTING_DUPLICATE` | **Policy**: Keep first (row 23, ₹2400) by default; second is flagged for skip. User chooses. |
| 9 | 14 | "Pizza Friday" — percentages: 30+30+30+20=110% (not 100%) | `PERCENTAGE_SUM_MISMATCH` | **Policy**: Normalize to 100% by applying a scale factor (each % ÷ 1.1). Documented on the expense note. |
| 10 | 35 | "Groceries BigBasket" Apr 2 — split_with includes Meera who left at end of March | `STALE_MEMBER` | **Policy**: Flagged. Notes say "oops Meera still in the group list". User decides to remove Meera from split or keep as-is. |
| 11 | 21 | "Scooter rentals" — split_type=share with "Aisha 1; Rohan 2; Priya 1; Dev 2" | Valid (not a bug) | **Policy**: Parsed correctly as weighted shares. No flag needed. |
| 12 | 33 | "Deep cleaning service" — notes say "is this April 5 or May 4?" | `AMBIGUOUS_DATE` | **Policy**: Flagged. Date as stored (May 4) is used by default; user prompted to confirm. |
| 13 | 13 | Settlement row has null split_type | Handled as part of anomaly #2 | Part of settlement detection logic. |
| 14 | 42 | "Furniture for common room" — split_type=equal but split_details also provided (shares) | `SPLIT_TYPE_CONFLICT` | **Policy**: `split_type` field is authoritative. Equal split used, split_details ignored. Flagged for awareness. |

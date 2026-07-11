/**
 * Balance Engine
 *
 * Calculates net balances per member and then uses a greedy debt-minimisation
 * algorithm to produce the smallest number of payment transactions.
 *
 * All amounts are in INR (pre-converted via fxRate at time of expense entry).
 */

export interface RawBalance {
  memberName: string;
  net: number; // positive = is owed money, negative = owes money
}

export interface Transaction {
  fromMemberName: string;
  toMemberName: string;
  amount: number;
}

/**
 * Given a list of (member, net-balance) pairs, produce the minimum set of
 * transactions that settles all debts. Uses the greedy two-pointer approach.
 *
 * Complexity: O(n log n) — acceptable for small flat-mate groups.
 */
export function minimizeTransactions(balances: RawBalance[]): Transaction[] {
  // Filter out zero-balance members
  const nonZero = balances
    .filter((b) => Math.abs(b.net) > 0.005)
    .map((b) => ({ ...b, net: Math.round(b.net * 100) / 100 }));

  const creditors = nonZero.filter((b) => b.net > 0).sort((a, b) => b.net - a.net);
  const debtors = nonZero.filter((b) => b.net < 0).sort((a, b) => a.net - b.net);

  const transactions: Transaction[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];

    const amount = Math.min(credit.net, -debt.net);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      transactions.push({
        fromMemberName: debt.memberName,
        toMemberName: credit.memberName,
        amount: rounded,
      });
    }

    credit.net -= amount;
    debt.net += amount;

    if (Math.abs(credit.net) < 0.005) ci++;
    if (Math.abs(debt.net) < 0.005) di++;
  }

  return transactions;
}

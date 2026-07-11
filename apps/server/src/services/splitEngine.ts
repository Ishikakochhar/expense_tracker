/**
 * Split Calculation Engine
 * Handles all split types: equal, unequal, percentage, share
 */

export interface SplitMember {
  memberName: string;
  memberId?: string;
  amount?: number;
  percentage?: number;
  shareValue?: number;
}

export interface ComputedSplit {
  memberName: string;
  memberId?: string;
  amount: number;
  shareValue?: number;
  percentage?: number;
}

/**
 * Compute individual split amounts from expense parameters.
 * Amounts are rounded to 2 decimal places; any rounding remainder
 * is added to the first member to keep the total exact.
 */
export function computeSplits(
  splitType: string,
  totalAmount: number,
  members: SplitMember[],
): ComputedSplit[] {
  if (members.length === 0) return [];

  switch (splitType) {
    case 'equal': {
      const baseAmount = Math.floor((totalAmount / members.length) * 100) / 100;
      const remainder = Math.round((totalAmount - baseAmount * members.length) * 100) / 100;
      return members.map((m, i) => ({
        memberName: m.memberName,
        memberId: m.memberId,
        amount: i === 0 ? Math.round((baseAmount + remainder) * 100) / 100 : baseAmount,
      }));
    }

    case 'unequal': {
      return members.map((m) => ({
        memberName: m.memberName,
        memberId: m.memberId,
        amount: m.amount ?? 0,
      }));
    }

    case 'percentage': {
      const totalPct = members.reduce((sum, m) => sum + (m.percentage ?? 0), 0);
      // Normalise if percentages don't sum to 100 (anomaly handling)
      const factor = totalPct > 0 ? 100 / totalPct : 1;

      const splits = members.map((m) => ({
        memberName: m.memberName,
        memberId: m.memberId,
        percentage: m.percentage ?? 0,
        amount: Math.floor(((m.percentage ?? 0) * factor * totalAmount) / 100 * 100) / 100,
      }));

      // Fix rounding
      const splitTotal = splits.reduce((s, x) => s + x.amount, 0);
      const diff = Math.round((totalAmount - splitTotal) * 100) / 100;
      if (splits.length > 0) splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;

      return splits;
    }

    case 'share': {
      const totalShares = members.reduce((sum, m) => sum + (m.shareValue ?? 1), 0);
      const splits = members.map((m) => {
        const shares = m.shareValue ?? 1;
        return {
          memberName: m.memberName,
          memberId: m.memberId,
          shareValue: shares,
          amount: Math.floor((shares / totalShares) * totalAmount * 100) / 100,
        };
      });

      // Fix rounding
      const splitTotal = splits.reduce((s, x) => s + x.amount, 0);
      const diff = Math.round((totalAmount - splitTotal) * 100) / 100;
      if (splits.length > 0) splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;

      return splits;
    }

    default:
      return members.map((m) => ({
        memberName: m.memberName,
        memberId: m.memberId,
        amount: m.amount ?? 0,
      }));
  }
}

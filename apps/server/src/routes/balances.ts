import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { minimizeTransactions, RawBalance } from '../services/balanceEngine';

export const balancesRouter = Router();
balancesRouter.use(authenticate);

// GET /api/balances/global
balancesRouter.get('/global', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;

    const memberships = await prisma.groupMembership.findMany({
      where: { userId, leftAt: null },
      select: { groupId: true, user: { select: { name: true } } },
    });

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) {
      res.json({ success: true, data: { balances: [], transactions: [], memberExpenseBreakdown: {} } });
      return;
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: { splits: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: { in: groupIds } },
    });

    const balanceMap: Map<string, number> = new Map();
    const addBalance = (name: string, delta: number) => {
      balanceMap.set(name, Math.round(((balanceMap.get(name) ?? 0) + delta) * 100) / 100);
    };

    for (const expense of expenses) {
      const payer = expense.paidByName;
      for (const split of expense.splits) {
        const participant = split.memberName;
        if (participant !== payer) {
          addBalance(participant, -split.amount);
          addBalance(payer, split.amount);
        }
      }
    }

    for (const settlement of settlements) {
      addBalance(settlement.fromMemberName, settlement.amountInr);
      addBalance(settlement.toMemberName, -settlement.amountInr);
    }

    const rawBalances: RawBalance[] = Array.from(balanceMap.entries()).map(([memberName, net]) => ({
      memberName,
      net: Math.round(net * 100) / 100,
    }));

    const transactions = minimizeTransactions(rawBalances);

    res.json({
      success: true,
      data: {
        balances: rawBalances,
        transactions,
        memberExpenseBreakdown: {}, // Keep empty for global for now to save payload size
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/balances/:groupId
balancesRouter.get('/:groupId', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;

  // Fetch all expenses with splits
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true },
  });

  // Fetch all settlements
  const settlements = await prisma.settlement.findMany({ where: { groupId } });

  // Build a net balance map: memberName → net INR balance
  // Positive = others owe them, Negative = they owe others
  const netMap: Map<string, number> = new Map();

  const ensureEntry = (name: string) => {
    if (!netMap.has(name)) netMap.set(name, 0);
  };

  for (const expense of expenses) {
    const payer = expense.paidByName;
    ensureEntry(payer);

    for (const split of expense.splits) {
      const participant = split.memberName;
      ensureEntry(participant);

      if (participant === payer) {
        // Payer is owed by others: their share is already subtracted from total
        // Net effect: payer receives total - their own share
        netMap.set(payer, (netMap.get(payer) ?? 0) + expense.amountInr - split.amount);
        // (will be adjusted below by subtracting each others' share from them)
      } else {
        // Non-payer owes their split amount to the payer
        netMap.set(participant, (netMap.get(participant) ?? 0) - split.amount);
        netMap.set(payer, (netMap.get(payer) ?? 0) + split.amount);
      }
    }
  }

  // Apply settlements
  for (const settlement of settlements) {
    ensureEntry(settlement.fromMemberName);
    ensureEntry(settlement.toMemberName);
    // From paid To, so From's balance improves, To's decreases
    netMap.set(settlement.fromMemberName, (netMap.get(settlement.fromMemberName) ?? 0) + settlement.amountInr);
    netMap.set(settlement.toMemberName, (netMap.get(settlement.toMemberName) ?? 0) - settlement.amountInr);
  }

  // Rebuild using proper net calculation
  // Recalculate: for each expense, payer lent total-amountInr, each participant owes their split
  const balanceMap: Map<string, number> = new Map();

  const addBalance = (name: string, delta: number) => {
    balanceMap.set(name, Math.round(((balanceMap.get(name) ?? 0) + delta) * 100) / 100);
  };

  for (const expense of expenses) {
    const payer = expense.paidByName;
    for (const split of expense.splits) {
      const participant = split.memberName;
      if (participant !== payer) {
        // Participant owes payer split.amount INR
        addBalance(participant, -split.amount);
        addBalance(payer, split.amount);
      }
    }
  }

  for (const settlement of settlements) {
    addBalance(settlement.fromMemberName, settlement.amountInr);
    addBalance(settlement.toMemberName, -settlement.amountInr);
  }

  const rawBalances: RawBalance[] = Array.from(balanceMap.entries()).map(([memberName, net]) => ({
    memberName,
    net: Math.round(net * 100) / 100,
  }));

  const transactions = minimizeTransactions(rawBalances);

  // Per-expense breakdown per member (Rohan's request)
  const memberExpenseBreakdown: Record<string, Array<{ expenseId: string; description: string; date: string; amount: number; currency: string }>> = {};

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (!memberExpenseBreakdown[split.memberName]) {
        memberExpenseBreakdown[split.memberName] = [];
      }
      memberExpenseBreakdown[split.memberName].push({
        expenseId: expense.id,
        description: expense.description,
        date: expense.date.toISOString(),
        amount: split.amount,
        currency: 'INR',
      });
    }
  }

    res.json({
      success: true,
      data: {
        balances: rawBalances,
        transactions,
        memberExpenseBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

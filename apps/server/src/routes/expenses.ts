import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { computeSplits } from '../services/splitEngine';

export const expensesRouter = Router();
expensesRouter.use(authenticate);

// GET /api/expenses?groupId=xxx
expensesRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId } = req.query;
  if (!groupId || typeof groupId !== 'string') {
    res.status(400).json({ success: false, error: 'groupId query param required' });
    return;
  }

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true },
    orderBy: { date: 'desc' },
  });

  res.json({ success: true, data: expenses });
});

// POST /api/expenses
expensesRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId, description, amount, currency, fxRate, paidByName, paidById, date, splitType, splits, notes } =
    req.body;

  if (!groupId || !description || amount == null || !paidByName || !date || !splitType) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const effectiveFxRate = fxRate ?? 1;
  const amountInr = Math.round(amount * effectiveFxRate * 100) / 100;
  const isRefund = amount < 0;

  // Compute splits
  const computedSplits = computeSplits(splitType, amountInr, splits ?? []);

  const expense = await prisma.expense.create({
    data: {
      groupId,
      description,
      amount,
      currency: currency ?? 'INR',
      fxRate: effectiveFxRate,
      amountInr,
      paidById: paidById ?? null,
      paidByName,
      date: new Date(date),
      splitType,
      notes,
      isRefund,
      splits: {
        create: computedSplits.map((s) => ({
          memberName: s.memberName,
          memberId: s.memberId ?? null,
          amount: s.amount,
          shareValue: s.shareValue ?? null,
          percentage: s.percentage ?? null,
        })),
      },
    },
    include: { splits: true },
  });

  res.status(201).json({ success: true, data: expense });
});

// GET /api/expenses/:id
expensesRouter.get('/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  const expense = await prisma.expense.findUnique({
    where: { id: _req.params.id },
    include: { splits: true },
  });

  if (!expense) {
    res.status(404).json({ success: false, error: 'Expense not found' });
    return;
  }

  res.json({ success: true, data: expense });
});

// DELETE /api/expenses/:id
expensesRouter.delete('/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  await prisma.expense.delete({ where: { id: _req.params.id } });
  res.json({ success: true, data: { deleted: true } });
});

// PATCH /api/expenses/:id
expensesRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { description, amount, currency, fxRate, paidByName, paidById, date, splitType, splits, notes } = req.body;

  const existingExpense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!existingExpense) {
    res.status(404).json({ success: false, error: 'Expense not found' });
    return;
  }

  const effectiveFxRate = fxRate ?? existingExpense.fxRate;
  const effectiveAmount = amount ?? existingExpense.amount;
  const amountInr = Math.round(effectiveAmount * effectiveFxRate * 100) / 100;

  const computedSplits = splits
    ? computeSplits(splitType ?? existingExpense.splitType, amountInr, splits)
    : null;

  await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      description: description ?? existingExpense.description,
      amount: effectiveAmount,
      currency: currency ?? existingExpense.currency,
      fxRate: effectiveFxRate,
      amountInr,
      paidByName: paidByName ?? existingExpense.paidByName,
      paidById: paidById ?? existingExpense.paidById,
      date: date ? new Date(date) : existingExpense.date,
      splitType: splitType ?? existingExpense.splitType,
      notes: notes ?? existingExpense.notes,
      isRefund: effectiveAmount < 0,
      ...(computedSplits
        ? {
            splits: {
              deleteMany: {},
              create: computedSplits.map((s) => ({
                memberName: s.memberName,
                memberId: s.memberId ?? null,
                amount: s.amount,
                shareValue: s.shareValue ?? null,
                percentage: s.percentage ?? null,
              })),
            },
          }
        : {}),
    },
    include: { splits: true },
  });

  const updated = await prisma.expense.findUnique({ where: { id: req.params.id }, include: { splits: true } });
  res.json({ success: true, data: updated });
});

import { Router, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const settlementsRouter = Router();
settlementsRouter.use(authenticate);

// GET /api/settlements?groupId=xxx
settlementsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.query;
    if (!groupId || typeof groupId !== 'string') {
      res.status(400).json({ success: false, error: 'groupId query param required' });
      return;
    }

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: settlements });
  } catch (error) {
    next(error);
  }
});

// POST /api/settlements
settlementsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, fromMemberName, fromMemberId, toMemberName, toMemberId, amount, currency, fxRate, date, note } =
      req.body;

    if (!groupId || !fromMemberName || !toMemberName || !amount || !date) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const effectiveFxRate = fxRate ?? 1;
    const amountInr = Math.round(amount * effectiveFxRate * 100) / 100;

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromMemberName,
        fromMemberId: fromMemberId ?? null,
        toMemberName,
        toMemberId: toMemberId ?? null,
        amount,
        currency: currency ?? 'INR',
        fxRate: effectiveFxRate,
        amountInr,
        date: new Date(date),
        note,
      },
    });

    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/settlements/:id
settlementsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.settlement.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

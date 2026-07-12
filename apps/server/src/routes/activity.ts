import { Router, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const activityRouter = Router();
activityRouter.use(authenticate);

// GET /api/activity
activityRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const groupId = req.query.groupId as string | undefined;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userName = user?.name || '';

    // Find all groups the user is a member of
    const memberships = await prisma.groupMembership.findMany({
      where: { userId, leftAt: null },
      select: { groupId: true, group: { select: { name: true } } },
    });

    if (groupId) {
      const isMember = memberships.some(m => m.groupId === groupId);
      if (!isMember) {
        res.status(403).json({ success: false, error: 'Not a member of this group' });
        return;
      }
    }

    const groupIds = memberships.map((m) => m.groupId);
    const groupNameMap = memberships.reduce((acc, m) => {
      acc[m.groupId] = m.group.name;
      return acc;
    }, {} as Record<string, string>);

    if (groupIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const targetGroupIds = groupId ? [groupId] : groupIds;

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: targetGroupIds } },
      include: { splits: true },
      orderBy: { date: 'desc' },
      take: 200, // Fetch more if we need to filter
    });

    // Fetch settlements
    const settlements = await prisma.settlement.findMany({
      where: { groupId: { in: targetGroupIds } },
      orderBy: { date: 'desc' },
      take: 200,
    });

    // Combine and sort
    let combined = [
      ...expenses.map((e) => ({ ...e, type: 'EXPENSE', groupName: groupNameMap[e.groupId] })),
      ...settlements.map((s) => ({ ...s, type: 'SETTLEMENT', groupName: groupNameMap[s.groupId] })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    // If global (no groupId), filter to only those related to the user
    if (!groupId) {
      combined = combined.filter((item: any) => {
        if (item.type === 'EXPENSE') {
          return item.paidByName === userName || item.splits.some((s: any) => s.memberName === userName);
        } else if (item.type === 'SETTLEMENT') {
          return item.fromMemberName === userName || item.toMemberName === userName;
        }
        return false;
      });
    }

    // Take top 100 combined
    res.json({ success: true, data: combined.slice(0, 100) });
  } catch (error) {
    next(error);
  }
});

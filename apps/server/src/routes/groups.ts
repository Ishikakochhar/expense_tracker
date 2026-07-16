import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { CreateGroupSchema } from '@expense-tracker/shared';

export const groupsRouter = Router();
groupsRouter.use(authenticate);

// GET /api/groups — list all groups the user belongs to
groupsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberships = await prisma.groupMembership.findMany({
      where: { userId: req.userId, leftAt: null },
      include: {
        group: {
          include: {
            memberships: {
              where: { leftAt: null },
              select: { id: true, displayName: true, userId: true, joinedAt: true },
            },
            _count: { select: { expenses: true } },
          },
        },
      },
    });

    const groups = memberships.map((m) => m.group);
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups — create a new group
groupsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parse = CreateGroupSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.flatten() });
      return;
    }

    const { name, defaultCurrency, memberNames } = parse.data;

    // Generate a 6-character uppercase alphanumeric join code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let joinCode = '';
    for (let i = 0; i < 6; i++) {
      joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({ data: { name, defaultCurrency, joinCode } });

      // Add the creator as the first member
      const creator = await tx.user.findUnique({ where: { id: req.userId } });
      const allNames = [creator!.name, ...memberNames.filter((n) => n !== creator!.name)];

      for (const memberName of allNames) {
        const existingUser = await tx.user.findFirst({
          where: { name: { equals: memberName, mode: 'insensitive' } },
        });
        await tx.groupMembership.create({
          data: {
            groupId: newGroup.id,
            userId: existingUser?.id ?? null,
            displayName: memberName,
          },
        });
      }

      return newGroup;
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

// GET /api/groups/join/info/:code - Get group info and unclaimed members by join code
groupsRouter.get('/join/info/:code', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const group = await prisma.group.findUnique({
      where: { joinCode: req.params.code },
      include: {
        memberships: {
          where: { userId: null, leftAt: null },
          select: { id: true, displayName: true },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Invalid join code' });
      return;
    }

    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/join - Join a group using join code
groupsRouter.post('/join', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { joinCode, claimDisplayName, newMemberName } = req.body;
    const userId = req.userId!;

    if (!joinCode) {
      res.status(400).json({ success: false, error: 'Join code is required' });
      return;
    }

    const group = await prisma.group.findUnique({ where: { joinCode } });
    if (!group) {
      res.status(404).json({ success: false, error: 'Invalid join code' });
      return;
    }

    // Check if user is already in the group
    const existingMembership = await prisma.groupMembership.findFirst({
      where: { groupId: group.id, userId, leftAt: null }
    });

    if (existingMembership) {
      res.json({ success: true, data: { groupId: group.id, message: 'Already a member' } });
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (claimDisplayName) {
        // Claim existing membership
        const membership = await tx.groupMembership.findFirst({
          where: { groupId: group.id, displayName: claimDisplayName, userId: null }
        });

        if (!membership) {
          throw new Error('Profile not found or already claimed');
        }

        // 1. Update membership
        await tx.groupMembership.update({
          where: { id: membership.id },
          data: { userId }
        });

        // 2. Update Expenses paid by this user
        await tx.expense.updateMany({
          where: { groupId: group.id, paidByName: claimDisplayName },
          data: { paidById: userId }
        });

        // 3. Update Expense Splits for this user
        await tx.expenseSplit.updateMany({
          where: { expense: { groupId: group.id }, memberName: claimDisplayName },
          data: { memberId: userId }
        });

        // 4. Update Settlements from this user
        await tx.settlement.updateMany({
          where: { groupId: group.id, fromMemberName: claimDisplayName },
          data: { fromMemberId: userId }
        });

        // 5. Update Settlements to this user
        await tx.settlement.updateMany({
          where: { groupId: group.id, toMemberName: claimDisplayName },
          data: { toMemberId: userId }
        });

      } else if (newMemberName) {
        // Join as new member
        const nameConflict = await tx.groupMembership.findFirst({
          where: { groupId: group.id, displayName: { equals: newMemberName, mode: 'insensitive' } }
        });

        if (nameConflict) {
          throw new Error(`Name "${newMemberName}" is already taken in this group`);
        }

        await tx.groupMembership.create({
          data: {
            groupId: group.id,
            userId,
            displayName: newMemberName,
            joinedAt: new Date(),
          }
        });
      } else {
        throw new Error('Must provide either claimDisplayName or newMemberName');
      }
    });

    res.json({ success: true, data: { groupId: group.id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/groups/:id — get a single group with members and expense summary
groupsRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        memberships: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            displayName: true,
            userId: true,
            joinedAt: true,
            leftAt: true,
          },
        },
        _count: { select: { expenses: true, settlements: true } },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found' });
      return;
    }

    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/members — add a member
groupsRouter.post('/:id/members', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { displayName, userId } = req.body;
    if (!displayName) {
      res.status(400).json({ success: false, error: 'displayName required' });
      return;
    }

    const membership = await prisma.groupMembership.create({
      data: {
        groupId: req.params.id,
        userId: userId ?? null,
        displayName,
        joinedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/groups/:id/members/:memberId/leave — mark member as left
groupsRouter.patch('/:id/members/:memberId/leave', async (req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const membership = await prisma.groupMembership.update({
      where: { id: req.params.memberId },
      data: { leftAt: new Date() },
    });
    res.json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
});

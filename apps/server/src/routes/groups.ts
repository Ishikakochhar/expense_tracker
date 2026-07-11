import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { CreateGroupSchema } from '@expense-tracker/shared';

export const groupsRouter = Router();
groupsRouter.use(authenticate);

// GET /api/groups — list all groups the user belongs to
groupsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
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
});

// POST /api/groups — create a new group
groupsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = CreateGroupSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.flatten() });
    return;
  }

  const { name, defaultCurrency, memberNames } = parse.data;

  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({ data: { name, defaultCurrency } });

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
          userId: existingUser?.id ?? req.userId!,
          displayName: memberName,
        },
      });
    }

    return newGroup;
  });

  res.status(201).json({ success: true, data: group });
});

// GET /api/groups/:id — get a single group with members and expense summary
groupsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
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
});

// PATCH /api/groups/:id/members — add a member
groupsRouter.post('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
  const { displayName, userId } = req.body;
  if (!displayName) {
    res.status(400).json({ success: false, error: 'displayName required' });
    return;
  }

  const membership = await prisma.groupMembership.create({
    data: {
      groupId: req.params.id,
      userId: userId ?? req.userId!,
      displayName,
      joinedAt: new Date(),
    },
  });

  res.status(201).json({ success: true, data: membership });
});

// PATCH /api/groups/:id/members/:memberId/leave — mark member as left
groupsRouter.patch('/:id/members/:memberId/leave', async (_req: AuthRequest, res: Response): Promise<void> => {
  const membership = await prisma.groupMembership.update({
    where: { id: _req.params.memberId },
    data: { leftAt: new Date() },
  });
  res.json({ success: true, data: membership });
});

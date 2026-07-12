import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { LoginSchema, RegisterSchema } from '@expense-tracker/shared';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.flatten() });
      return;
    }

    const { name, email, password } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions,
    );

    res.status(201).json({ success: true, data: { user, token } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Email already in use' });
      return;
    }
    next(error);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.flatten() });
      return;
    }

    const { email, password } = parse.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions,
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token' });
      return;
    }
    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/auth/profile — update name and/or email
authRouter.patch('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email } = req.body;
    if (!name && !email) {
      res.status(400).json({ success: false, error: 'Provide name or email to update' });
      return;
    }

    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: req.userId } } });
      if (existing) {
        res.status(409).json({ success: false, error: 'Email already in use' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { ...(name ? { name } : {}), ...(email ? { email } : {}) },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });

    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/account — delete account and all data
authRouter.delete('/account', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, error: 'Password confirmation required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Password is incorrect' });
      return;
    }

    await prisma.user.delete({ where: { id: req.userId } });

    res.json({ success: true, data: { message: 'Account deleted' } });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/export — export all user transactions as CSV
authRouter.get('/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberships = await prisma.groupMembership.findMany({
      where: { userId: req.userId! },
      select: { groupId: true, group: { select: { name: true } } },
    });
    const groupIds = memberships.map((m) => m.groupId);
    const groupNameMap = memberships.reduce(
      (acc, m) => { acc[m.groupId] = m.group.name; return acc; },
      {} as Record<string, string>,
    );

    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: { splits: true },
      orderBy: { date: 'desc' },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { date: 'desc' },
    });

    const rows: string[] = ['type,group,date,description,amount,currency,paid_by,split_type,notes'];

    for (const e of expenses) {
      rows.push(
        [
          'expense',
          `"${groupNameMap[e.groupId] ?? ''}"`,
          e.date.toISOString().split('T')[0],
          `"${(e.description ?? '').replace(/"/g, '""')}"`,
          e.amount,
          e.currency,
          `"${e.paidByName}"`,
          e.splitType,
          `"${(e.notes ?? '').replace(/"/g, '""')}"`,
        ].join(','),
      );
    }

    for (const s of settlements) {
      rows.push(
        [
          'settlement',
          `"${groupNameMap[s.groupId] ?? ''}"`,
          s.date.toISOString().split('T')[0],
          '"Settlement"',
          s.amount,
          s.currency,
          `"${s.fromMemberName}"`,
          'settlement',
          `"${(s.note ?? '').replace(/"/g, '""')}"`,
        ].join(','),
      );
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hearth-export.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

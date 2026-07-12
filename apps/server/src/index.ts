import 'dotenv/config';

// Prevent server from crashing on unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
});
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { groupsRouter } from './routes/groups';
import { expensesRouter } from './routes/expenses';
import { settlementsRouter } from './routes/settlements';
import { balancesRouter } from './routes/balances';
import { importRouter } from './routes/import';
import { activityRouter } from './routes/activity';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/balances', balancesRouter);
app.use('/api/import', importRouter);
app.use('/api/activity', activityRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// Vercel serverless functions don't need app.listen() — they just need the app exported.
// We only listen if running locally.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;

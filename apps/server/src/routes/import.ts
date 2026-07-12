import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { detectAnomalies } from '../services/anomalyDetector';
import { computeSplits } from '../services/splitEngine';
import { getUsdToInrRate } from '../utils/fxRates';
import { RawImportRow } from '@expense-tracker/shared';

export const importRouter = Router();
importRouter.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are accepted'));
    }
  },
});

/**
 * POST /api/import/preview
 * Accepts a CSV or XLSX file, parses it, runs anomaly detection, and returns
 * the full anomaly report + parsed rows without committing anything to the DB.
 */
importRouter.post('/preview', upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  const { groupId } = req.body;
  if (!groupId) {
    res.status(400).json({ success: false, error: 'groupId is required' });
    return;
  }

  // Parse CSV/XLSX
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

  const rows: RawImportRow[] = raw.map((r, i) => ({
    rowIndex: i + 2, // +2 because row 1 is header
    date: parseDate(r['date']),
    description: toString(r['description']),
    paid_by: toString(r['paid_by']),
    amount: parseAmount(r['amount']),
    currency: toString(r['currency']),
    split_type: toString(r['split_type']),
    split_with: toString(r['split_with']),
    split_details: toString(r['split_details']),
    notes: toString(r['notes']),
  }));

  const anomalies = detectAnomalies(rows);

  // Create an import session in the DB (PENDING)
  const session = await prisma.importSession.create({
    data: {
      groupId,
      filename: req.file.originalname,
      status: 'PENDING',
      anomalies: {
        create: anomalies.map((a) => ({
          rowIndex: a.rowIndex,
          anomalyType: a.type,
          message: a.message,
          resolution: a.suggestedResolution,
          rowData: a.data as object,
        })),
      },
    },
  });

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      totalRows: rows.length,
      validRows: rows.length - anomalies.filter((a) => a.suggestedResolution === 'SKIP').length,
      anomalyCount: anomalies.length,
      anomalies,
      rows, // Send back all rows so client can show them with anomaly highlights
    },
  });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/import/commit
 * Takes a session ID and the user's resolution decisions, then imports
 * approved rows into the expenses table.
 */
importRouter.post('/commit', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId, groupId, resolutions, rows } = req.body;

  if (!sessionId || !groupId || !resolutions || !rows) {
    res.status(400).json({ success: false, error: 'sessionId, groupId, resolutions, and rows are required' });
    return;
  }

  // resolutions: { [rowIndex]: AnomalyResolution }
  const resolutionMap: Map<number, string> = new Map(Object.entries(resolutions).map(([k, v]) => [parseInt(k), v as string]));

  // Pre-fetch memberships to normalize casing
  const groupMemberships = await prisma.groupMembership.findMany({ where: { groupId } });
  const caseMap = new Map(groupMemberships.map(m => [m.displayName.toLowerCase(), m.displayName]));
  const normalizeCasing = (name: string) => caseMap.get(name.toLowerCase()) || name;

  const importedExpenses: string[] = [];
  const importedSettlements: string[] = [];
  const skippedRows: number[] = [];
  const importReport: Array<{ rowIndex: number; action: string; description: string }> = [];

  const USD_TO_INR = await getUsdToInrRate();

  for (const row of rows as RawImportRow[]) {
    const resolution = resolutionMap.get(row.rowIndex) ?? 'KEEP';

    if (resolution === 'SKIP') {
      skippedRows.push(row.rowIndex);
      importReport.push({ rowIndex: row.rowIndex, action: 'SKIPPED', description: row.description ?? '' });
      continue;
    }

    // Handle settlement conversion
    if (resolution === 'CONVERT_TO_SETTLEMENT') {
      const fromName = normalizeCasing(normalizePersonName(row.paid_by ?? 'Unknown'));
      const toName = normalizeCasing(normalizePersonName(row.split_with ?? 'Unknown'));
      
      const settlement = await prisma.settlement.create({
        data: {
          groupId,
          fromMemberName: fromName,
          fromMemberId: null,
          toMemberName: toName,
          toMemberId: null,
          amount: row.amount ?? 0,
          currency: row.currency ?? 'INR',
          fxRate: 1,
          amountInr: row.amount ?? 0,
          date: safeDate(row.date, resolution),
          note: row.notes ?? undefined,
        },
      });

      for (const name of [fromName, toName]) {
        if (!caseMap.has(name.toLowerCase())) {
          const user = await prisma.user.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
          });
          const m = await prisma.groupMembership.create({
            data: {
              groupId,
              displayName: name,
              userId: user?.id ?? null,
              joinedAt: new Date(),
            }
          });
          caseMap.set(name.toLowerCase(), m.displayName);
        }
      }

      importedSettlements.push(settlement.id);
      importReport.push({ rowIndex: row.rowIndex, action: 'CONVERTED_TO_SETTLEMENT', description: row.description ?? '' });
      continue;
    }

    // Determine final values after resolution
    const currency = row.currency?.trim() || 'INR';
    const fxRate = currency === 'USD' ? USD_TO_INR : 1;
    const amount = resolution === 'KEEP_AS_ZERO' ? 0 : Math.abs(row.amount ?? 0) * (resolution === 'KEEP_AS_REFUND' ? -1 : 1);
    const amountInr = Math.round(amount * fxRate * 100) / 100;
    const paidByName = normalizeCasing(normalizePersonName(row.paid_by ?? 'Unknown'));
    const date = safeDate(row.date, resolution);
    const splitType = row.split_type === 'percentage' && resolution === 'NORMALIZE_PERCENTAGES' ? 'percentage' : (row.split_type ?? 'equal').toLowerCase().trim();

    // Parse split_with members
    const memberNames = (row.split_with ?? '')
      .split(';')
      .map((n) => normalizePersonName(n.trim()))
      .filter(Boolean);

    // Parse split_details
    const splitMembers = parseSplitDetails(splitType, memberNames, row.split_details, amountInr);

    // Compute final splits
    const computedSplits = computeSplits(splitType, amountInr, splitMembers);

    const expense = await prisma.expense.create({
      data: {
        groupId,
        description: row.description ?? 'Imported expense',
        amount,
        currency,
        fxRate,
        amountInr,
        paidByName,
        paidById: null,
        date,
        splitType,
        notes: buildNotes(row.notes, resolution),
        isRefund: amount < 0,
        splits: {
          create: computedSplits.map((s) => ({
            memberName: normalizeCasing(s.memberName),
            memberId: null,
            amount: s.amount,
            shareValue: s.shareValue ?? null,
            percentage: s.percentage ?? null,
          })),
        },
      },
    });

    // Extract all unique names from this row (case-normalized)
    const namesInRow = new Set([paidByName, ...computedSplits.map(s => normalizeCasing(s.memberName))]);
    for (const name of Array.from(namesInRow)) {
      if (!caseMap.has(name.toLowerCase())) {
        // Find if they exist as a user to link them automatically
        const user = await prisma.user.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } }
        });
        const m = await prisma.groupMembership.create({
          data: {
            groupId,
            displayName: name,
            userId: user?.id ?? null,
            joinedAt: new Date(),
          }
        });
        caseMap.set(name.toLowerCase(), m.displayName);
      }
    }

    importedExpenses.push(expense.id);
    importReport.push({ rowIndex: row.rowIndex, action: 'IMPORTED', description: row.description ?? '' });
  }

  // Mark session as committed
  await prisma.importSession.update({
    where: { id: sessionId },
    data: { status: 'COMMITTED' },
  });

  // Update anomaly resolutions
  for (const [rowIndex, resolution] of resolutionMap.entries()) {
    await prisma.importAnomaly.updateMany({
      where: { importSessionId: sessionId, rowIndex },
      data: { resolution, resolvedAt: new Date() },
    });
  }

  res.json({
    success: true,
    data: {
      importedExpenses: importedExpenses.length,
      importedSettlements: importedSettlements.length,
      skippedRows: skippedRows.length,
      importReport,
    },
  });
  } catch (error) {
    next(error);
  }
});

// GET /api/import/sessions/:groupId
importRouter.get('/sessions/:groupId', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await prisma.importSession.findMany({
      where: { groupId: req.params.groupId },
      include: { anomalies: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toString(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function parseAmount(val: unknown): number | null {
  if (val == null) return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function parseDate(val: unknown): string | null {
  if (val == null) return null;
  if (val instanceof Date) return val.toISOString();
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function safeDate(dateStr: string | null, resolution: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();

  // Fix year if resolution is FIX_DATE
  if (resolution === 'FIX_DATE' && d.getFullYear() < 2020) {
    d.setFullYear(2026);
  }
  return d;
}

function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

const resolutionMessages: Record<string, string> = {
  'CONVERT_TO_SETTLEMENT': 'Automatically converted to settlement',
  'FIX_DATE': 'Invalid date automatically fixed',
  'FIX_CURRENCY': 'Missing currency defaulted to INR',
  'KEEP_AS_REFUND': 'Processed as a refund',
  'KEEP_AS_ZERO': 'Processed as a zero-amount expense',
  'NORMALIZE_PERCENTAGES': 'Percentages normalized to sum to 100%',
  'SKIP': 'Duplicate skipped',
  'PENDING': 'Pending manual review',
};

function buildNotes(original: string | null, resolution: string): string | undefined {
  const humanResolution = resolutionMessages[resolution] || resolution;
  const parts = [original, resolution !== 'KEEP' ? `Import note: ${humanResolution}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : undefined;
}

function parseSplitDetails(
  splitType: string,
  memberNames: string[],
  splitDetails: string | null,
  totalAmountInr: number,
): Array<{ memberName: string; amount?: number; percentage?: number; shareValue?: number }> {
  if (!splitDetails || splitType === 'equal') {
    return memberNames.map((name) => ({ memberName: name }));
  }

  if (splitType === 'unequal') {
    // e.g. "Rohan 700; Priya 400; Meera 400"
    const parts = splitDetails.split(';').map((p) => p.trim());
    return parts.map((p) => {
      const match = p.match(/^(.+?)\s+([\d.]+)$/);
      if (match) {
        return { memberName: normalizePersonName(match[1]), amount: parseFloat(match[2]) };
      }
      return { memberName: p };
    });
  }

  if (splitType === 'percentage') {
    // e.g. "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%"
    const parts = splitDetails.split(';').map((p) => p.trim());
    return parts.map((p) => {
      const match = p.match(/^(.+?)\s+([\d.]+)%$/);
      if (match) {
        return { memberName: normalizePersonName(match[1]), percentage: parseFloat(match[2]) };
      }
      return { memberName: p };
    });
  }

  if (splitType === 'share') {
    // e.g. "Aisha 1; Rohan 2; Priya 1; Dev 2"
    const parts = splitDetails.split(';').map((p) => p.trim());
    return parts.map((p) => {
      const match = p.match(/^(.+?)\s+([\d.]+)$/);
      if (match) {
        return { memberName: normalizePersonName(match[1]), shareValue: parseFloat(match[2]) };
      }
      return { memberName: p };
    });
  }

  return memberNames.map((name) => ({ memberName: name }));
}

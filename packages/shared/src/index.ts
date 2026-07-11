import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const SplitType = z.enum(['equal', 'unequal', 'percentage', 'share']);
export type SplitType = z.infer<typeof SplitType>;

export const AnomalyType = z.enum([
  'DUPLICATE_EXPENSE',
  'SETTLEMENT_AS_EXPENSE',
  'MISSING_PAID_BY',
  'WRONG_YEAR',
  'MISSING_CURRENCY',
  'NEGATIVE_AMOUNT',
  'ZERO_AMOUNT',
  'CONFLICTING_DUPLICATE',
  'PERCENTAGE_SUM_MISMATCH',
  'STALE_MEMBER',
  'AMBIGUOUS_DATE',
  'SPLIT_TYPE_CONFLICT',
  'UNKNOWN',
]);
export type AnomalyType = z.infer<typeof AnomalyType>;

export const AnomalyResolution = z.enum([
  'KEEP',
  'SKIP',
  'CONVERT_TO_SETTLEMENT',
  'FIX_DATE',
  'FIX_CURRENCY',
  'KEEP_AS_REFUND',
  'KEEP_AS_ZERO',
  'KEEP_FIRST',
  'KEEP_SECOND',
  'NORMALIZE_PERCENTAGES',
  'REMOVE_STALE_MEMBER',
  'PENDING',
]);
export type AnomalyResolution = z.infer<typeof AnomalyResolution>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Groups ───────────────────────────────────────────────────────────────────

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  defaultCurrency: z.string().default('INR'),
  memberNames: z.array(z.string().min(1)).min(1),
});
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const ExpenseSplitInput = z.object({
  memberId: z.string(),
  amount: z.number().optional(),
  percentage: z.number().optional(),
  shareValue: z.number().optional(),
});

export const CreateExpenseSchema = z.object({
  groupId: z.string(),
  description: z.string().min(1).max(255),
  amount: z.number(),
  currency: z.string().default('INR'),
  fxRate: z.number().default(1),
  paidById: z.string(),
  date: z.string().datetime(),
  splitType: SplitType,
  splits: z.array(ExpenseSplitInput),
  notes: z.string().optional(),
});
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// ─── Settlements ──────────────────────────────────────────────────────────────

export const CreateSettlementSchema = z.object({
  groupId: z.string(),
  fromMemberId: z.string(),
  toMemberId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  date: z.string().datetime(),
  note: z.string().optional(),
});
export type CreateSettlementInput = z.infer<typeof CreateSettlementSchema>;

// ─── Import ───────────────────────────────────────────────────────────────────

export interface RawImportRow {
  rowIndex: number;
  date: string | null;
  description: string | null;
  paid_by: string | null;
  amount: number | null;
  currency: string | null;
  split_type: string | null;
  split_with: string | null;
  split_details: string | null;
  notes: string | null;
}

export interface ImportAnomaly {
  rowIndex: number;
  type: AnomalyType;
  message: string;
  suggestedResolution: AnomalyResolution;
  data: RawImportRow;
  relatedRowIndex?: number;
}

export interface ImportPreviewResult {
  sessionId: string;
  totalRows: number;
  validRows: number;
  anomalyCount: number;
  anomalies: ImportAnomaly[];
}

// ─── API Response types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BalanceEntry {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  currency: string;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  netBalance: number;
  owes: BalanceEntry[];
  isOwed: BalanceEntry[];
}

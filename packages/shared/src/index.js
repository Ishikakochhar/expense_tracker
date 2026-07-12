"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSettlementSchema = exports.CreateExpenseSchema = exports.ExpenseSplitInput = exports.CreateGroupSchema = exports.RegisterSchema = exports.LoginSchema = exports.AnomalyResolution = exports.AnomalyType = exports.SplitType = void 0;
const zod_1 = require("zod");
// ─── Enums ───────────────────────────────────────────────────────────────────
exports.SplitType = zod_1.z.enum(['equal', 'unequal', 'percentage', 'share']);
exports.AnomalyType = zod_1.z.enum([
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
exports.AnomalyResolution = zod_1.z.enum([
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
// ─── Auth ─────────────────────────────────────────────────────────────────────
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
// ─── Groups ───────────────────────────────────────────────────────────────────
exports.CreateGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    defaultCurrency: zod_1.z.string().default('INR'),
    memberNames: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
// ─── Expenses ─────────────────────────────────────────────────────────────────
exports.ExpenseSplitInput = zod_1.z.object({
    memberId: zod_1.z.string(),
    amount: zod_1.z.number().optional(),
    percentage: zod_1.z.number().optional(),
    shareValue: zod_1.z.number().optional(),
});
exports.CreateExpenseSchema = zod_1.z.object({
    groupId: zod_1.z.string(),
    description: zod_1.z.string().min(1).max(255),
    amount: zod_1.z.number(),
    currency: zod_1.z.string().default('INR'),
    fxRate: zod_1.z.number().default(1),
    paidById: zod_1.z.string(),
    date: zod_1.z.string().datetime(),
    splitType: exports.SplitType,
    splits: zod_1.z.array(exports.ExpenseSplitInput),
    notes: zod_1.z.string().optional(),
});
// ─── Settlements ──────────────────────────────────────────────────────────────
exports.CreateSettlementSchema = zod_1.z.object({
    groupId: zod_1.z.string(),
    fromMemberId: zod_1.z.string(),
    toMemberId: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('INR'),
    date: zod_1.z.string().datetime(),
    note: zod_1.z.string().optional(),
});

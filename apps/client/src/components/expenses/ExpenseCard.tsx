import { format } from 'date-fns';
import { RefreshCw, Minus } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  fxRate: number;
  amountInr: number;
  paidByName: string;
  date: string;
  splitType: string;
  isRefund: boolean;
  notes?: string;
  splits: Array<{ memberName: string; amount: number }>;
}

interface Props {
  expense: Expense;
  groupId: string;
}

const splitTypeColors: Record<string, string> = {
  equal: 'badge-blue',
  unequal: 'badge-purple',
  percentage: 'badge-yellow',
  share: 'badge-green',
};

export function ExpenseCard({ expense }: Props) {
  const isUSD = expense.currency !== 'INR';

  return (
    <div className="card p-4 hover:border-surface-border/80 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            expense.isRefund ? 'bg-red-500/15' : 'bg-brand-600/15'
          }`}
        >
          {expense.isRefund ? (
            <RefreshCw className="w-4 h-4 text-red-400" />
          ) : (
            <Minus className="w-4 h-4 text-brand-400" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{expense.description}</p>
              <p className="text-sm text-muted">
                Paid by <span className="text-zinc-300 font-medium">{expense.paidByName}</span>
                {' · '}
                {format(new Date(expense.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-white">
                {expense.isRefund ? '-' : ''}
                {isUSD ? `$${Math.abs(expense.amount).toFixed(2)}` : `₹${Math.abs(expense.amount).toLocaleString('en-IN')}`}
              </p>
              {isUSD && (
                <p className="text-xs text-zinc-500">≈ ₹{Math.abs(expense.amountInr).toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Splits preview + badge */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge ${splitTypeColors[expense.splitType] ?? 'badge-blue'}`}>
              {expense.splitType}
            </span>
            {expense.isRefund && <span className="badge badge-red">Refund</span>}
            <span className="text-xs text-muted">
              Split {expense.splits.length} way{expense.splits.length !== 1 ? 's' : ''}
            </span>
          </div>

          {expense.notes && (
            <p className="text-xs text-zinc-500 mt-1.5 italic">"{expense.notes}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { format } from 'date-fns';
import { RefreshCw, Minus, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { EditExpenseModal } from './EditExpenseModal';

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
  equal: 'bg-primary-container text-on-primary-container',
  unequal: 'bg-secondary-container text-on-secondary-container',
  percentage: 'bg-surface-dim text-on-surface-variant',
  share: 'bg-tertiary-fixed text-on-tertiary-fixed',
};

export function ExpenseCard({ expense, groupId }: Props) {
  const isUSD = expense.currency !== 'INR';
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-4 hover:shadow-md transition-all relative group">
      
      {/* Edit Button */}
      <button 
        onClick={() => setIsEditModalOpen(true)}
        className="absolute top-4 right-4 p-2 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface-variant transition-colors opacity-0 group-hover:opacity-100"
        title="Edit Expense"
      >
        <Edit3 className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-10">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            expense.isRefund ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-primary'
          }`}
        >
          {expense.isRefund ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-headline-md text-base text-primary truncate">{expense.description}</p>
              <p className="font-body-md text-sm text-on-surface-variant">
                Paid by <span className="font-semibold text-primary">{expense.paidByName}</span>
                {' · '}
                {format(new Date(expense.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="sm:text-right flex-shrink-0">
              <p className="font-display-lg text-xl text-primary leading-none">
                {expense.isRefund ? '-' : ''}
                {isUSD ? `$${Math.abs(expense.amount).toFixed(2)}` : `₹${Math.abs(expense.amount).toLocaleString('en-IN')}`}
              </p>
              {isUSD && (
                 <p className="font-data-mono text-xs text-on-surface-variant mt-1">≈ ₹{Math.abs(expense.amountInr).toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Splits preview + badge */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-xs border border-outline-variant/20 ${splitTypeColors[expense.splitType] ?? splitTypeColors.equal}`}>
              {expense.splitType}
            </span>
            {expense.isRefund && <span className="px-2.5 py-0.5 rounded-full font-label-sm text-xs bg-error-container text-error border border-error/20">Refund</span>}
            <span className="font-body-md text-xs text-on-surface-variant">
              Split {expense.splits.length} way{expense.splits.length !== 1 ? 's' : ''}
            </span>
          </div>

          {expense.notes && (
            <p className="font-body-md text-sm text-on-surface-variant mt-2 italic border-l-2 border-outline-variant/30 pl-2">"{expense.notes}"</p>
          )}
        </div>
      </div>
    </div>

    {isEditModalOpen && (
      <EditExpenseModal 
        expense={expense} 
        groupId={groupId}
        onClose={() => setIsEditModalOpen(false)} 
      />
    )}
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface EditExpenseModalProps {
  expense: any;
  groupId: string;
  onClose: () => void;
}

export function EditExpenseModal({ expense, groupId, onClose }: EditExpenseModalProps) {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(Math.abs(expense.amount).toString());
  const [date, setDate] = useState(expense.date.split('T')[0]);
  const [paidByName, setPaidByName] = useState(expense.paidByName);
  const [notes, setNotes] = useState(expense.notes || '');

  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.patch(`/expenses/${expense.id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['group', groupId] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      toast.success('Expense updated!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update expense');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = expense.isRefund ? -Math.abs(Number(amount)) : Number(amount);
    updateMutation.mutate({
      description,
      amount: finalAmount,
      date: new Date(date).toISOString(),
      paidByName,
      notes: notes.trim() === '' ? null : notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-ambient overflow-hidden flex flex-col max-h-[90vh]">
        
        <header className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface-container-lowest/80 backdrop-blur-md z-10">
          <h2 className="font-headline-md text-xl text-primary">Edit Expense</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          <form id="edit-expense-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-label-sm text-on-surface-variant mb-1">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-label-sm text-on-surface-variant mb-1">Amount ({expense.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-label-sm text-on-surface-variant mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-label-sm text-on-surface-variant mb-1">Paid By (Name)</label>
              <input
                type="text"
                required
                value={paidByName}
                onChange={(e) => setPaidByName(e.target.value)}
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-label-sm text-on-surface-variant mb-1 flex justify-between">
                Notes
                {notes.includes('Pending manual review') && (
                  <button 
                    type="button" 
                    onClick={() => setNotes(notes.replace(/\|?\s*(Import note: )?Pending manual review/g, '').trim())}
                    className="text-xs text-secondary hover:underline"
                  >
                    Clear pending note
                  </button>
                )}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg resize-y min-h-[80px]"
              />
            </div>
          </form>
        </div>

        <footer className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-lowest sticky bottom-0 z-10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-label-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            Cancel
          </button>
          <button
            form="edit-expense-form"
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-full font-label-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-all flex items-center justify-center min-w-[120px] shadow-ambient disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}

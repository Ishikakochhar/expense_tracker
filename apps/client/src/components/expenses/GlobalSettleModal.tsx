import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, HandCoins } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface GlobalSettleModalProps {
  otherPerson: string;
  defaultAmount: number;
  userOwes: boolean;
  onClose: () => void;
}

export function GlobalSettleModal({ otherPerson, defaultAmount, userOwes, onClose }: GlobalSettleModalProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [amount, setAmount] = useState(defaultAmount.toString());
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [note, setNote] = useState<string>('');

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then((r) => r.data.data),
  });

  const sharedGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g: any) => 
      g.memberships.some((m: any) => m.displayName.toLowerCase() === otherPerson.toLowerCase())
    );
  }, [groups, otherPerson]);

  // Auto-select if there's only 1 shared group
  useMemo(() => {
    if (sharedGroups.length === 1 && !selectedGroupId) {
      setSelectedGroupId(sharedGroups[0].id);
    }
  }, [sharedGroups, selectedGroupId]);

  const settleMutation = useMutation({
    mutationFn: (payload: any) => api.post('/settlements', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      if (selectedGroupId) {
        qc.invalidateQueries({ queryKey: ['settlements', selectedGroupId] });
      }
      toast.success('Settlement recorded!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to record settlement');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error('Please select a group');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const finalNote = `Paid via ${paymentMode}${note ? ` - ${note}` : ''}`;

    settleMutation.mutate({
      groupId: selectedGroupId,
      fromMemberName: userOwes ? user?.name : otherPerson,
      toMemberName: userOwes ? otherPerson : user?.name,
      amount: numericAmount,
      currency: 'INR',
      date: new Date().toISOString(),
      note: finalNote,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-ambient overflow-hidden flex flex-col">
        
        <header className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <h2 className="font-headline-md text-xl text-primary">Settle Up</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6">
          <form id="global-settle-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="text-center">
              <p className="font-body-lg text-on-surface-variant">
                {userOwes ? (
                  <>You are paying <span className="font-bold text-primary">{otherPerson}</span></>
                ) : (
                  <><span className="font-bold text-primary">{otherPerson}</span> is paying you</>
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="font-display-lg text-3xl text-on-surface-variant">₹</span>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 bg-transparent text-center font-display-lg text-4xl text-primary focus:outline-none border-b-2 border-outline-variant/30 focus:border-secondary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-label-sm text-on-surface-variant mb-2">Which group is this for?</label>
              {groupsLoading ? (
                <div className="animate-pulse h-12 bg-surface-container rounded-xl"></div>
              ) : sharedGroups.length === 0 ? (
                <div className="p-4 bg-error-container/20 text-error rounded-xl font-body-md text-sm">
                  You don't share any groups with this person.
                </div>
              ) : (
                <select
                  required
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
                >
                  {sharedGroups.length > 1 && <option value="" disabled>Select a group...</option>}
                  {sharedGroups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-label-sm text-on-surface-variant mb-2">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-label-sm text-on-surface-variant mb-2">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. For dinner"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-lg"
                />
              </div>
            </div>

          </form>
        </div>

        <footer className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-label-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            Cancel
          </button>
          <button
            form="global-settle-form"
            type="submit"
            disabled={settleMutation.isPending || sharedGroups.length === 0 || !selectedGroupId}
            className="px-6 py-2.5 rounded-full font-label-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-all flex items-center justify-center min-w-[120px] shadow-ambient disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {settleMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Record Payment'}
          </button>
        </footer>
      </div>
    </div>
  );
}

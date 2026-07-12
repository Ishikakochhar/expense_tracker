import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

type SplitType = 'equal' | 'unequal' | 'percentage' | 'share';

interface SplitEntry {
  memberName: string;
  amount: number;
  percentage: number;
  shareValue: number;
}

export function NewExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: groupData } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then((r) => r.data.data),
  });

  const activeMembers = (groupData?.memberships ?? []).filter((m: any) => !m.leftAt);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    currency: 'INR',
    fxRate: '83.5',
    paidByName: '',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal' as SplitType,
    notes: '',
  });

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splits, setSplits] = useState<SplitEntry[]>([]);

  // Sync splits when members change
  const toggleMember = (name: string) => {
    setSelectedMembers((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      setSplits(next.map((n) => ({ memberName: n, amount: 0, percentage: 0, shareValue: 1 })));
      return next;
    });
  };

  const updateSplit = (idx: number, field: keyof SplitEntry, value: number) => {
    setSplits((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post('/expenses', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      toast.success('Expense added!');
      navigate(`/groups/${groupId}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add expense'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      toast.error('Select at least one member to split with');
      return;
    }

    const amount = parseFloat(form.amount);
    const fxRate = form.currency === 'USD' ? parseFloat(form.fxRate) : 1;

    const splitPayload = splits.map((s) => ({
      memberName: s.memberName,
      amount: s.amount || undefined,
      percentage: s.percentage || undefined,
      shareValue: s.shareValue || undefined,
    }));

    createMutation.mutate({
      groupId,
      description: form.description,
      amount,
      currency: form.currency,
      fxRate,
      paidByName: form.paidByName,
      date: new Date(form.date).toISOString(),
      splitType: form.splitType,
      splits: splitPayload,
      notes: form.notes || undefined,
    });
  };

  const splitTypeOptions: SplitType[] = ['equal', 'unequal', 'percentage', 'share'];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Group
      </button>

      <div>
        <h1 className="font-display-lg text-3xl md:text-4xl text-primary leading-tight">Add Expense</h1>
        <p className="font-body-lg text-on-surface-variant mt-1">Log a new shared expense</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-6 sm:p-8 space-y-5">
          <h2 className="font-headline-md text-2xl text-primary mb-2">Expense Details</h2>

          <div>
            <label className="block font-label-sm text-primary mb-1">Description</label>
            <input
              className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
              placeholder="e.g. Groceries, Rent, Electricity"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-label-sm text-primary mb-1">Amount</label>
              <input
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-label-sm text-primary mb-1">Currency</label>
              <select
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {form.currency === 'USD' && (
            <div>
              <label className="block font-label-sm text-primary mb-1">FX Rate (1 USD = ? INR)</label>
              <input
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                type="number"
                step="0.01"
                value={form.fxRate}
                onChange={(e) => setForm({ ...form, fxRate: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-label-sm text-primary mb-1">Paid by</label>
              <select
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                value={form.paidByName}
                onChange={(e) => setForm({ ...form, paidByName: e.target.value })}
                required
              >
                <option value="">Select member</option>
                {activeMembers.map((m: any) => (
                  <option key={m.id} value={m.displayName}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-primary mb-1">Date</label>
              <input
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-primary mb-1">Notes (optional)</label>
            <input
              className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
              placeholder="Any additional context..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Split configuration */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-6 sm:p-8 space-y-6">
          <h2 className="font-headline-md text-2xl text-primary">Split</h2>

          {/* Split type selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {splitTypeOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={`py-3 px-4 rounded-xl font-label-sm transition-all border ${
                  form.splitType === type
                    ? 'bg-primary-container border-primary-container text-on-primary-container font-bold shadow-sm'
                    : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container'
                }`}
                onClick={() => setForm({ ...form, splitType: type })}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Member selection */}
          <div className="pt-2">
            <label className="block font-label-sm text-primary mb-3">Split with</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeMembers.map((m: any) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.displayName)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-sm transition-all border ${
                    selectedMembers.includes(m.displayName)
                      ? 'bg-secondary-container border-secondary-container text-on-secondary-container shadow-sm'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${selectedMembers.includes(m.displayName) ? 'bg-surface-container-lowest text-on-secondary-container' : 'bg-surface-dim text-on-surface-variant'}`}>
                    {m.displayName.charAt(0).toUpperCase()}
                  </div>
                  {m.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Per-member split inputs (for non-equal types) */}
          {form.splitType !== 'equal' && splits.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-outline-variant/30">
              <label className="block font-label-sm text-primary mb-2">
                {form.splitType === 'unequal' && 'Amount per person (INR)'}
                {form.splitType === 'percentage' && 'Percentage per person'}
                {form.splitType === 'share' && 'Shares per person'}
              </label>
              {splits.map((split, i) => (
                <div key={split.memberName} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-headline-md font-bold text-on-primary-container flex-shrink-0">
                    {split.memberName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-body-md text-primary w-24 truncate">{split.memberName}</span>
                  <div className="flex-1 relative flex items-center">
                    <input
                      className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={form.splitType === 'share' ? '1' : '0'}
                      value={
                        form.splitType === 'unequal'
                          ? split.amount || ''
                          : form.splitType === 'percentage'
                          ? split.percentage || ''
                          : split.shareValue || ''
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const field =
                          form.splitType === 'unequal'
                            ? 'amount'
                            : form.splitType === 'percentage'
                            ? 'percentage'
                            : 'shareValue';
                        updateSplit(i, field as keyof SplitEntry, val);
                      }}
                    />
                    {form.splitType === 'percentage' && <span className="absolute right-4 font-data-mono text-on-surface-variant">%</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="w-full py-4 px-6 rounded-full bg-primary text-on-primary font-bold font-body-lg hover:opacity-90 transition-all shadow-ambient mt-2" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}

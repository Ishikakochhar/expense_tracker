import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="page-title mb-6">Add Expense</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Expense Details</h2>

          <div>
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="e.g. Groceries, Rent, Electricity"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount</label>
              <input
                className="input"
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
              <label className="label">Currency</label>
              <select
                className="input"
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
              <label className="label">FX Rate (1 USD = ? INR)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.fxRate}
                onChange={(e) => setForm({ ...form, fxRate: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Paid by</label>
              <select
                className="input"
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
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              placeholder="Any additional context..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Split configuration */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Split</h2>

          {/* Split type selector */}
          <div className="grid grid-cols-4 gap-2">
            {splitTypeOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                  form.splitType === type
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-white'
                }`}
                onClick={() => setForm({ ...form, splitType: type })}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Member selection */}
          <div>
            <label className="label">Split with</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeMembers.map((m: any) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.displayName)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    selectedMembers.includes(m.displayName)
                      ? 'bg-brand-600/20 border-brand-600/50 text-brand-300'
                      : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {m.displayName.charAt(0)}
                  </div>
                  {m.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Per-member split inputs (for non-equal types) */}
          {form.splitType !== 'equal' && splits.length > 0 && (
            <div className="space-y-2">
              <label className="label">
                {form.splitType === 'unequal' && 'Amount per person (INR)'}
                {form.splitType === 'percentage' && 'Percentage per person'}
                {form.splitType === 'share' && 'Shares per person'}
              </label>
              {splits.map((split, i) => (
                <div key={split.memberName} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {split.memberName.charAt(0)}
                  </div>
                  <span className="text-sm text-zinc-300 w-24 truncate">{split.memberName}</span>
                  <input
                    className="input flex-1"
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
                  {form.splitType === 'percentage' && <span className="text-zinc-500">%</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}

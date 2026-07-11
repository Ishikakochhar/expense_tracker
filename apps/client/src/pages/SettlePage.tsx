import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export function SettlePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    fromMemberName: '',
    toMemberName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const { data: groupData } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then((r) => r.data.data),
  });

  const { data: balancesData } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => api.get(`/balances/${groupId}`).then((r) => r.data.data),
  });

  const activeMembers = (groupData?.memberships ?? []).filter((m: any) => !m.leftAt);
  const transactions = balancesData?.transactions ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post('/settlements', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
      qc.invalidateQueries({ queryKey: ['settlements', groupId] });
      toast.success('Settlement recorded!');
      navigate(`/groups/${groupId}/balances`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to record settlement'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      groupId,
      fromMemberName: form.fromMemberName,
      toMemberName: form.toMemberName,
      amount: parseFloat(form.amount),
      currency: 'INR',
      date: new Date(form.date).toISOString(),
      note: form.note || undefined,
    });
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="page-title mb-6">Record Settlement</h1>

      {/* Suggested settlements */}
      {transactions.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Suggested Payments</h2>
          <div className="space-y-2">
            {transactions.map((t: any, i: number) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-elevated hover:border-brand-600/40 border border-surface-border transition-all text-left"
                onClick={() =>
                  setForm({
                    ...form,
                    fromMemberName: t.fromMemberName,
                    toMemberName: t.toMemberName,
                    amount: t.amount.toFixed(2),
                  })
                }
              >
                <span className="text-sm text-red-300 font-medium">{t.fromMemberName}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-sm text-emerald-300 font-medium">{t.toMemberName}</span>
                <span className="ml-auto text-white font-semibold text-sm">₹{t.amount.toFixed(2)}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">Click a suggestion to fill the form</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Who paid</label>
            <select
              className="input"
              value={form.fromMemberName}
              onChange={(e) => setForm({ ...form, fromMemberName: e.target.value })}
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
            <label className="label">Paid to</label>
            <select
              className="input"
              value={form.toMemberName}
              onChange={(e) => setForm({ ...form, toMemberName: e.target.value })}
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (₹)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
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
          <label className="label">Note (optional)</label>
          <input
            className="input"
            placeholder="e.g. Cash payment in person"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Recording...' : 'Record Settlement'}
        </button>
      </form>
    </div>
  );
}

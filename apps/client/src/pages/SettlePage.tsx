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
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['settlements', groupId] });
      qc.invalidateQueries({ queryKey: ['activity'] });
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
    <div className="max-w-lg mx-auto animate-fade-in space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Group
      </button>

      <div>
        <h1 className="font-display-lg text-3xl md:text-4xl text-primary leading-tight">Record Settlement</h1>
        <p className="font-body-lg text-on-surface-variant mt-1">Log a payment to settle debts</p>
      </div>

      {/* Suggested settlements */}
      {transactions.length > 0 && (
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-6">
          <h2 className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Suggested Payments</h2>
          <div className="space-y-3">
            {transactions.map((t: any, i: number) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest hover:border-primary/40 border border-outline-variant/30 transition-all text-left shadow-sm"
                onClick={() =>
                  setForm({
                    ...form,
                    fromMemberName: t.fromMemberName,
                    toMemberName: t.toMemberName,
                    amount: t.amount.toFixed(2),
                  })
                }
              >
                <span className="font-body-lg text-error font-medium">{t.fromMemberName}</span>
                <ArrowRight className="w-4 h-4 text-outline" />
                <span className="font-body-lg text-primary font-medium">{t.toMemberName}</span>
                <span className="ml-auto text-primary font-data-mono text-lg">₹{t.amount.toFixed(2)}</span>
              </button>
            ))}
          </div>
          <p className="font-body-md text-xs text-on-surface-variant mt-3 italic">Click a suggestion to pre-fill the form</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-label-sm text-primary mb-1">Who paid</label>
            <select
              className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
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
            <label className="block font-label-sm text-primary mb-1">Paid to</label>
            <select
              className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-label-sm text-primary mb-1">Amount (₹)</label>
            <input
              className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
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
          <label className="block font-label-sm text-primary mb-1">Note (optional)</label>
          <input
            className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
            placeholder="e.g. Cash payment in person"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <button type="submit" className="w-full py-4 px-6 mt-4 rounded-full bg-primary text-on-primary font-bold font-body-lg hover:opacity-90 transition-all shadow-ambient" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Recording...' : 'Record Settlement'}
        </button>
      </form>
    </div>
  );
}

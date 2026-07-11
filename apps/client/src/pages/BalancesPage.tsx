import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

export function BalancesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => api.get(`/balances/${groupId}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-surface-elevated rounded-xl" />
        <div className="h-48 bg-surface-elevated rounded-2xl" />
      </div>
    );
  }

  const balances = data?.balances ?? [];
  const transactions = data?.transactions ?? [];
  const breakdown = data?.memberExpenseBreakdown ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-title">Balances</h1>

      {/* Settlement summary (Aisha's view: "one number per person") */}
      <div className="card p-6">
        <h2 className="section-title mb-1">Who Pays Whom</h2>
        <p className="text-muted text-sm mb-5">Minimum number of payments to settle all debts</p>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">All settled up!</p>
            <p className="text-muted text-sm mt-1">No outstanding payments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center text-sm font-bold text-red-300">
                  {t.fromMemberName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    <span className="text-red-300">{t.fromMemberName}</span>
                    {' → '}
                    <span className="text-emerald-300">{t.toMemberName}</span>
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <p className="font-bold text-white">₹{t.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Net balances per member */}
      <div className="card p-6">
        <h2 className="section-title mb-5">Net Balances</h2>
        <div className="space-y-2">
          {balances.map((b: any) => (
            <div key={b.memberName}>
              <button
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors"
                onClick={() => setExpandedMember(expandedMember === b.memberName ? null : b.memberName)}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    b.net > 0 ? 'bg-emerald-500/20' : b.net < 0 ? 'bg-red-500/20' : 'bg-surface-elevated'
                  }`}
                >
                  {b.memberName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-white text-sm">{b.memberName}</p>
                  <p className={`text-xs font-semibold ${b.net > 0 ? 'text-emerald-400' : b.net < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {b.net > 0 ? `Gets back ₹${b.net.toFixed(2)}` : b.net < 0 ? `Owes ₹${Math.abs(b.net).toFixed(2)}` : 'Settled'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {b.net > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : b.net < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-zinc-500" />
                  )}
                  {breakdown[b.memberName] && (
                    expandedMember === b.memberName
                      ? <ChevronDown className="w-4 h-4 text-zinc-500" />
                      : <ChevronRight className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {/* Expense breakdown drill-down (Rohan's request) */}
              {expandedMember === b.memberName && breakdown[b.memberName] && (
                <div className="ml-12 mt-1 mb-2 space-y-1 animate-slide-up">
                  {breakdown[b.memberName].map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-elevated/50 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-300 truncate">{item.description}</p>
                        <p className="text-zinc-600 text-xs">{new Date(item.date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <p className="text-zinc-400 font-medium ml-3">₹{item.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

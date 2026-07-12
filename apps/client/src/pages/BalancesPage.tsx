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
      <div className="space-y-4 animate-pulse max-w-3xl mx-auto">
        <div className="h-10 w-48 bg-surface-container rounded-full" />
        <div className="h-48 bg-surface-container-lowest rounded-xl" />
      </div>
    );
  }

  const balances = data?.balances ?? [];
  const transactions = data?.transactions ?? [];
  const breakdown = data?.memberExpenseBreakdown ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <h1 className="font-display-lg text-3xl md:text-4xl text-primary leading-tight">Balances</h1>

      {/* Settlement summary (Aisha's view: "one number per person") */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="font-headline-md text-2xl text-primary mb-1">Who Pays Whom</h2>
          <p className="font-body-md text-on-surface-variant mb-6">Minimum number of payments to settle all debts</p>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4 shadow-sm">
                <TrendingUp className="w-8 h-8 text-on-primary-container" />
              </div>
              <p className="font-headline-md text-xl text-primary">All settled up!</p>
              <p className="font-body-md text-on-surface-variant mt-2">No outstanding payments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-outline-variant/30">
                  <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center font-headline-md font-bold text-on-error-container shadow-sm">
                    {t.fromMemberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-lg text-primary">
                      <span className="font-bold text-error">{t.fromMemberName}</span>
                      <span className="text-on-surface-variant px-2">→</span>
                      <span className="font-bold text-primary">{t.toMemberName}</span>
                    </p>
                  </div>
                  <p className="font-display-lg text-xl text-primary">₹{t.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Net balances per member */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="font-headline-md text-2xl text-primary mb-6">Net Balances</h2>
          <div className="space-y-2">
            {balances.map((b: any) => (
              <div key={b.memberName}>
                <button
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container/50 transition-colors"
                  onClick={() => setExpandedMember(expandedMember === b.memberName ? null : b.memberName)}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-headline-md font-bold text-lg shadow-sm ${
                      b.net > 0 ? 'bg-primary-container text-on-primary-container' : b.net < 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-dim text-on-surface-variant'
                    }`}
                  >
                    {b.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-headline-md text-lg text-primary truncate">{b.memberName}</p>
                    <p className={`font-data-mono text-sm ${b.net > 0 ? 'text-primary' : b.net < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                      {b.net > 0 ? `Gets back ₹${b.net.toFixed(2)}` : b.net < 0 ? `Owes ₹${Math.abs(b.net).toFixed(2)}` : 'Settled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {b.net > 0 ? (
                      <TrendingUp className="w-5 h-5 text-primary" />
                    ) : b.net < 0 ? (
                      <TrendingDown className="w-5 h-5 text-error" />
                    ) : (
                      <Minus className="w-5 h-5 text-on-surface-variant" />
                    )}
                    {breakdown[b.memberName] && (
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                        {expandedMember === b.memberName
                          ? <ChevronDown className="w-5 h-5 text-primary" />
                          : <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                        }
                      </div>
                    )}
                  </div>
                </button>

                {/* Expense breakdown drill-down (Rohan's request) */}
                {expandedMember === b.memberName && breakdown[b.memberName] && (
                  <div className="ml-16 mt-2 mb-4 space-y-2 animate-slide-up relative">
                    {/* Left border for visual grouping */}
                    <div className="absolute left-[-24px] top-2 bottom-2 w-px bg-outline-variant/50"></div>
                    {breakdown[b.memberName].map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 px-4 rounded-lg bg-surface border border-outline-variant/30">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-body-md text-primary truncate">{item.description}</p>
                          <p className="font-body-md text-on-surface-variant text-xs">{new Date(item.date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <p className="font-data-mono text-sm text-primary">₹{item.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

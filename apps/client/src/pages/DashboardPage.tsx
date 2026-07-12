import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import api from '@/lib/api';
import { useI18n } from '@/hooks/useI18n';
import { GlobalSettleModal } from '@/components/expenses/GlobalSettleModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [settleModalData, setSettleModalData] = useState<{
    isOpen: boolean;
    otherPerson: string;
    amount: number;
    userOwes: boolean;
  } | null>(null);

  const { data: globalBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', 'global'],
    queryFn: () => api.get('/balances/global').then((r) => r.data.data),
  });

  const { data: globalActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/activity').then((res) => res.data.data),
  });

  // Calculate The Bottom Line for current user
  const userNetBalance = globalBalances?.balances.find((b: any) => b.memberName === user?.name)?.net || 0;
  
  // Who pays whom involving user
  const userTransactions = (globalBalances?.transactions || []).filter(
    (t: any) => t.fromMemberName === user?.name || t.toMemberName === user?.name
  );

  // Calculate total expenses over the last 30 days or so, just sum them up for the chart
  const totalExpenses = globalActivity
    .filter((a: any) => a.type === 'EXPENSE' && !a.isRefund)
    .reduce((sum: number, a: any) => sum + a.amountInr, 0);

  const expensesByGroup = useMemo(() => {
    const map = new Map<string, number>();
    globalActivity
      .filter((a: any) => a.type === 'EXPENSE' && !a.isRefund)
      .forEach((a: any) => {
        const name = a.groupName || 'Other';
        map.set(name, (map.get(name) || 0) + a.amountInr);
      });
    
    // Using a selection of theme colors for the chart
    const colors = ['#242e2b', '#a0c8be', '#2e4a44', '#ffb598', '#5a2710', '#1c2e28', '#8fb8ae'];
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value: Math.round(value),
      fill: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [globalActivity]);

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display-lg text-display-lg text-primary mb-3">{t('dashboard.tagline')}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Settlement & Who Pays Who */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* The One Number (Settlement Card) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-ambient p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-secondary-fixed-dim rounded-full blur-[60px] opacity-40 -mr-16 -mt-16 pointer-events-none"></div>
            
            <h2 className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-6">{t('dashboard.bottomLine')}</h2>
            
            <div className="flex flex-col gap-2 mb-6 relative z-10">
              <p className="font-headline-md text-headline-md text-primary">
                {userNetBalance > 0 
                  ? t('dashboard.overallYouGetBack')
                  : userNetBalance < 0
                  ? t('dashboard.overallYouOwe')
                  : t('dashboard.allSettled')}
              </p>
              <p className={`font-display-lg text-4xl md:text-5xl ${userNetBalance > 0 ? 'text-primary' : userNetBalance < 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                ₹{Math.abs(userNetBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center relative z-10">
              <button 
                onClick={() => navigate('/groups')}
                className="bg-secondary text-on-secondary font-label-sm px-6 py-3 rounded-full hover:bg-secondary/90 transition-colors shadow-sm"
              >
                {t('dashboard.goToGroups')}
              </button>
              <button 
                onClick={() => navigate('/activity')}
                className="text-on-surface-variant font-label-sm px-4 py-3 hover:bg-surface-container rounded-full transition-colors flex items-center gap-2"
              >
                {t('dashboard.viewDetails')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Who Pays Whom */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-ambient p-6">
            <div className="flex justify-between items-end mb-6 border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-md text-headline-md text-primary">{t('dashboard.settlementPlan')}</h3>
              <span className="font-label-sm text-on-surface-variant">{t('dashboard.acrossGroups')}</span>
            </div>
            
            <div className="space-y-2">
              {balancesLoading ? (
                 <div className="animate-pulse space-y-4">
                   <div className="h-12 bg-surface-container rounded-lg"></div>
                   <div className="h-12 bg-surface-container rounded-lg"></div>
                 </div>
              ) : userTransactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="font-body-md text-on-surface-variant">{t('dashboard.noSettlements')}</p>
                </div>
              ) : (
                userTransactions.map((tx: any, i: number) => {
                  const userOwes = tx.fromMemberName === user?.name;
                  const otherPerson = userOwes ? tx.toMemberName : tx.fromMemberName;
                  
                  return (
                    <button 
                      key={i} 
                      onClick={() => setSettleModalData({ isOpen: true, otherPerson, amount: tx.amount, userOwes })}
                      className="w-full text-left flex items-center justify-between p-3 hover:bg-surface-container rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 transition-transform group-hover:scale-105 ${userOwes ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                          {otherPerson.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-body-md text-primary font-medium">{otherPerson}</p>
                          <p className="font-label-sm text-xs text-on-surface-variant">
                            {userOwes ? 'you owe them' : 'owes you'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {userOwes ? (
                          <ArrowDownRight className="w-4 h-4 text-secondary transition-transform group-hover:translate-y-0.5" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-primary transition-transform group-hover:-translate-y-0.5" />
                        )}
                        <p className={`font-data-mono text-lg font-medium ${userOwes ? 'text-secondary' : 'text-primary'}`}>
                          ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chart & Recent */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Organic Chart Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-ambient p-6 flex flex-col items-center text-center overflow-hidden relative">
            <div className="w-full text-left mb-6 border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-md text-headline-md text-primary mb-1">{t('dashboard.totalExpenses')}</h3>
              <p className="font-body-md text-on-surface-variant text-xs">{t('dashboard.acrossGroups')}</p>
            </div>
            
            <div className="relative w-full flex justify-center mb-10 h-48">
              {expensesByGroup.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByGroup}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesByGroup.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `₹${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1c2e28', color: '#d8e5e0' }}
                      itemStyle={{ color: '#d8e5e0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <p className="text-on-surface-variant text-sm font-label-sm">No expenses yet</p>
                </div>
              )}
              {expensesByGroup.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-label-sm text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Total</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    ₹{activityLoading ? '...' : (totalExpenses / 1000).toFixed(1)}k
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              {expensesByGroup.slice(0, 5).map((entry, i) => (
                <div key={i} className="bg-surface-container px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant/20">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                  <span className="font-label-sm text-on-surface-variant truncate max-w-[120px]">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary text-on-primary rounded-3xl p-6 relative overflow-hidden shadow-ambient cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => navigate('/groups')}>
             <div className="absolute -right-6 -bottom-6 opacity-10">
                <Receipt className="w-32 h-32" />
             </div>
             <h3 className="font-headline-md text-headline-md mb-2 relative z-10">{t('dashboard.splitSomething')}</h3>
             <p className="font-body-md text-xs text-on-primary/80 mb-5 relative z-10">Add a new expense to one of your groups.</p>
             <div className="inline-flex items-center gap-2 bg-on-primary text-primary px-5 py-2.5 rounded-full font-label-sm font-bold relative z-10">
                {t('dashboard.selectGroup')}
                <ArrowRight className="w-4 h-4" />
             </div>
            </div>
          </div>
        </div>
      </div>
      
      {settleModalData?.isOpen && (
        <GlobalSettleModal
          otherPerson={settleModalData.otherPerson}
          defaultAmount={settleModalData.amount}
          userOwes={settleModalData.userOwes}
          onClose={() => setSettleModalData(null)}
        />
      )}
    </>
  );
}

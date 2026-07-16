import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Plus, Upload, HandCoins, BarChart3, Receipt, UserCheck, UserX, CalendarDays, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [activeTab, setActiveTab] = useState<'expenses' | 'activity'>('expenses');

  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then((r) => r.data.data),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => api.get('/expenses', { params: { groupId } }).then((r) => r.data.data),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity', groupId],
    queryFn: () => api.get(`/activity`, { params: { groupId } }).then((r) => r.data.data),
  });

  const group = groupData;
  const expenses = expensesData ?? [];
  const activity = activityData ?? [];

  if (groupLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-surface-container rounded-full" />
        <div className="h-32 bg-surface-container-lowest rounded-xl" />
        <div className="h-64 bg-surface-container-lowest rounded-xl" />
      </div>
    );
  }

  if (!group) return <div className="text-on-surface-variant">Group not found</div>;

  const activeMembers = group.memberships.filter((m: any) => !m.leftAt);
  const formerMembers = group.memberships.filter((m: any) => m.leftAt);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-md font-bold text-xl shadow-sm">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-display-lg text-display-lg text-primary leading-tight">{group.name}</h1>
          </div>
          <p className="font-body-md text-on-surface-variant ml-[60px]">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
            {formerMembers.length > 0 && ` · ${formerMembers.length} former`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/groups/${groupId}/balances`} className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full border border-outline-variant text-primary font-bold font-label-sm hover:bg-surface-container transition-all bg-surface-container-lowest shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Balances
          </Link>
          <Link to={`/groups/${groupId}/settle`} className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full border border-outline-variant text-secondary font-bold font-label-sm hover:bg-secondary-container hover:text-on-secondary-container transition-all bg-surface-container-lowest shadow-sm">
            <HandCoins className="w-4 h-4" />
            Settle Up
          </Link>
          <Link to={`/groups/${groupId}/import`} className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full border border-outline-variant text-primary font-bold font-label-sm hover:bg-surface-container transition-all bg-surface-container-lowest shadow-sm">
            <Upload className="w-4 h-4" />
            Import CSV
          </Link>
          <Link to={`/groups/${groupId}/expenses/new`} className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full bg-primary text-on-primary font-bold font-label-sm hover:opacity-90 transition-all shadow-ambient">
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-ambient p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Members</h2>
              {group.joinCode && (
                <div 
                  className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high cursor-pointer px-3 py-1.5 rounded-full border border-outline-variant/30 group/code transition-colors" 
                  title="Copy join code"
                  onClick={() => { navigator.clipboard.writeText(group.joinCode); toast.success('Code copied to clipboard!'); }}
                >
                  <span className="font-label-sm text-on-surface-variant text-xs">Code:</span>
                  <span className="font-data-mono font-bold text-primary text-sm">{group.joinCode}</span>
                  <div className="text-on-surface-variant group-hover/code:text-primary transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {activeMembers.map((m: any) => (
                <MemberRow key={m.id} member={m} active />
              ))}
            </div>

            {formerMembers.length > 0 && (
              <>
                <div className="h-px bg-outline-variant/30 my-5" />
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Former Members</p>
                <div className="space-y-3">
                  {formerMembers.map((m: any) => (
                    <MemberRow key={m.id} member={m} active={false} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expenses/Activity panel */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-6 mb-6 border-b border-outline-variant/30">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 font-headline-md text-lg transition-colors border-b-2 relative top-[1px] ${
                activeTab === 'expenses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 font-headline-md text-lg transition-colors border-b-2 relative top-[1px] ${
                activeTab === 'activity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Activity ({activity.length})
            </button>
          </div>

          {activeTab === 'expenses' ? (
            expensesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="bg-surface-container border border-outline-variant/30 rounded-xl h-24 animate-pulse" />)}
              </div>
            ) : expenses.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-ambient p-12 text-center mt-2">
                <Receipt className="w-12 h-12 text-outline mx-auto mb-4" strokeWidth={1.5} />
                <p className="font-headline-md text-xl text-primary mb-1">No expenses yet</p>
                <p className="font-body-md text-on-surface-variant mb-6">Add your first expense or import from CSV</p>
                <Link to={`/groups/${groupId}/expenses/new`} className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-primary text-on-primary font-bold font-label-sm hover:opacity-90 transition-all shadow-ambient">
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense: any) => (
                  <ExpenseCard key={expense.id} expense={expense} groupId={groupId!} />
                ))}
              </div>
            )
          ) : (
            activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="bg-surface-container border border-outline-variant/30 rounded-xl h-24 animate-pulse" />)}
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-body-md text-on-surface-variant">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface-container-lowest hover:bg-surface-container transition-colors rounded-xl border border-outline-variant/30">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'EXPENSE' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {item.type === 'EXPENSE' ? <Receipt className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-headline-md text-primary leading-tight">
                          {item.type === 'EXPENSE' ? item.description : 'Settled up'}
                        </p>
                        <p className="font-body-md text-sm text-on-surface-variant">
                          {format(new Date(item.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto pl-14 sm:pl-0">
                      <p className="font-data-mono font-medium text-lg text-primary">
                        ₹{item.amountInr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-label-sm text-xs text-on-surface-variant">
                        {item.type === 'EXPENSE' ? `Paid by ${item.paidByName}` : `${item.fromMemberName} paid ${item.toMemberName}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, active }: { member: any; active: boolean }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-md font-bold text-lg ${
          active ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
        }`}
      >
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-body-lg truncate ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
          {member.displayName}
        </p>
        {!active && member.leftAt && (
          <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
            <UserX className="w-3 h-3" />
            Left {format(new Date(member.leftAt), 'MMM d, yyyy')}
          </p>
        )}
        {active && (
          <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
            <CalendarDays className="w-3 h-3" />
            Since {format(new Date(member.joinedAt), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      {active ? (
        member.userId ? <UserCheck className="w-5 h-5 text-primary" /> : null
      ) : (
        <UserX className="w-5 h-5 text-outline-variant" />
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Plus, Upload, HandCoins, BarChart3, Receipt, UserCheck, UserX, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();

  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then((r) => r.data.data),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => api.get('/expenses', { params: { groupId } }).then((r) => r.data.data),
  });

  const group = groupData;
  const expenses = expensesData ?? [];

  if (groupLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-surface-elevated rounded-xl" />
        <div className="h-32 bg-surface-elevated rounded-2xl" />
        <div className="h-64 bg-surface-elevated rounded-2xl" />
      </div>
    );
  }

  if (!group) return <div className="text-muted">Group not found</div>;

  const activeMembers = group.memberships.filter((m: any) => !m.leftAt);
  const formerMembers = group.memberships.filter((m: any) => m.leftAt);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold">
              {group.name.charAt(0)}
            </div>
            <h1 className="page-title">{group.name}</h1>
          </div>
          <p className="text-muted text-sm ml-[52px]">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
            {formerMembers.length > 0 && ` · ${formerMembers.length} former`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/groups/${groupId}/balances`} className="btn-secondary flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4" />
            Balances
          </Link>
          <Link to={`/groups/${groupId}/settle`} className="btn-secondary flex items-center gap-2 text-sm">
            <HandCoins className="w-4 h-4" />
            Settle Up
          </Link>
          <Link to={`/groups/${groupId}/import`} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" />
            Import CSV
          </Link>
          <Link to={`/groups/${groupId}/expenses/new`} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Members</h2>
            <div className="space-y-2">
              {activeMembers.map((m: any) => (
                <MemberRow key={m.id} member={m} active />
              ))}
            </div>

            {formerMembers.length > 0 && (
              <>
                <div className="divider my-4" />
                <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Former Members</p>
                <div className="space-y-2">
                  {formerMembers.map((m: any) => (
                    <MemberRow key={m.id} member={m} active={false} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expenses panel */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Expenses ({expenses.length})</h2>
          </div>

          {expensesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="card p-12 text-center">
              <Receipt className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No expenses yet</p>
              <p className="text-muted text-sm mb-4">Add your first expense or import from CSV</p>
              <Link to={`/groups/${groupId}/expenses/new`} className="btn-primary inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add Expense
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense: any) => (
                <ExpenseCard key={expense.id} expense={expense} groupId={groupId!} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, active }: { member: any; active: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 ${
          active ? 'bg-gradient-brand border-brand-600/30' : 'bg-surface-elevated border-surface-border'
        }`}
      >
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-zinc-500'}`}>
          {member.displayName}
        </p>
        {!active && member.leftAt && (
          <p className="text-xs text-zinc-600 flex items-center gap-1">
            <UserX className="w-3 h-3" />
            Left {format(new Date(member.leftAt), 'MMM d, yyyy')}
          </p>
        )}
        {active && (
          <p className="text-xs text-zinc-600 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            Since {format(new Date(member.joinedAt), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      {active ? (
        <UserCheck className="w-4 h-4 text-emerald-500/70" />
      ) : (
        <UserX className="w-4 h-4 text-zinc-600" />
      )}
    </div>
  );
}

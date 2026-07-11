import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, Receipt, ArrowRight, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then((r) => r.data.data),
  });

  const groups = groupsData ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted mt-1">Here's an overview of your shared expenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Groups"
          value={String(groups.length)}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Total Expenses"
          value={String(groups.reduce((s: number, g: any) => s + (g._count?.expenses ?? 0), 0))}
          icon={<Receipt className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Active Groups"
          value={String(groups.filter((g: any) => g._count?.expenses > 0).length)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Groups overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your Groups</h2>
          <Link to="/groups" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {groups.length === 0 ? (
          <EmptyGroups />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.slice(0, 4).map((group: any) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    green: 'bg-emerald-500/15 text-emerald-400',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted text-sm font-medium">{label}</span>
        <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function GroupCard({ group }: { group: any }) {
  const memberCount = group.memberships?.length ?? 0;
  const expenseCount = group._count?.expenses ?? 0;

  return (
    <Link
      to={`/groups/${group.id}`}
      className="card p-5 hover:border-brand-600/50 hover:bg-surface-elevated transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold">
          {group.name.charAt(0).toUpperCase()}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-brand-400 transition-colors mt-1" />
      </div>
      <h3 className="font-semibold text-white mb-1">{group.name}</h3>
      <p className="text-sm text-muted">
        {memberCount} member{memberCount !== 1 ? 's' : ''} · {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
      </p>
    </Link>
  );
}

function EmptyGroups() {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No groups yet</h3>
      <p className="text-muted mb-6">Create your first group to start tracking shared expenses.</p>
      <Link to="/groups" className="btn-primary inline-flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Create a group
      </Link>
    </div>
  );
}


function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

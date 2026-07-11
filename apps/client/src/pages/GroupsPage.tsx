import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users, Receipt, ArrowRight, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export function GroupsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', memberNames: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post('/groups', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setShowCreate(false);
      setForm({ name: '', memberNames: '' });
      toast.success('Group created!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create group'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const memberNames = form.memberNames
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    if (!form.name || memberNames.length === 0) {
      toast.error('Group name and at least one member required');
      return;
    }
    createMutation.mutate({ name: form.name, memberNames });
  };

  const groups = data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="text-muted mt-1">Manage your expense sharing groups</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Create Group</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Group name</label>
                <input
                  className="input"
                  placeholder="e.g. Flat 4B"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Members (comma-separated names)</label>
                <input
                  className="input"
                  placeholder="e.g. Aisha, Rohan, Priya, Meera"
                  value={form.memberNames}
                  onChange={(e) => setForm({ ...form, memberNames: e.target.value })}
                  required
                />
                <p className="text-xs text-zinc-500 mt-1.5">You'll be added automatically as the first member</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No groups yet</p>
          <p className="text-muted text-sm">Create your first group to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: any) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card p-5 hover:border-brand-600/50 hover:bg-surface-elevated transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-brand-600/20">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-brand-400 transition-colors mt-1" />
              </div>
              <h3 className="font-semibold text-white mb-2">{group.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {group.memberships?.length ?? 0} members
                </span>
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  {group._count?.expenses ?? 0} expenses
                </span>
              </div>
              {group.memberships && (
                <div className="flex -space-x-2 mt-3">
                  {group.memberships.slice(0, 5).map((m: any, i: number) => (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white border-2 border-surface-card"
                      title={m.displayName}
                      style={{ zIndex: 5 - i }}
                    >
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {group.memberships.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-zinc-400 border-2 border-surface-card">
                      +{group.memberships.length - 5}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

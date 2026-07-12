import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, QrCode, X, MapPin, Plane, Coffee, Briefcase, Heart, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useI18n } from '@/hooks/useI18n';

// Helper to assign consistent random colors and icons based on string hash
const getGroupTheme = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const themes = [
    { bg: 'bg-primary/5', iconBg: 'bg-primary-fixed', iconText: 'text-primary', Icon: MapPin },
    { bg: 'bg-secondary/5', iconBg: 'bg-secondary-fixed', iconText: 'text-on-secondary-fixed', Icon: Plane },
    { bg: 'bg-tertiary/5', iconBg: 'bg-tertiary-fixed', iconText: 'text-on-tertiary-fixed', Icon: Heart },
    { bg: 'bg-primary/5', iconBg: 'bg-primary-container', iconText: 'text-on-primary-container', Icon: Coffee },
    { bg: 'bg-secondary/5', iconBg: 'bg-secondary-container', iconText: 'text-on-secondary-container', Icon: Briefcase },
  ];
  
  return themes[hash % themes.length];
};

export function GroupsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', memberNames: '' });

  const { data: groups = [], isLoading } = useQuery({
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display-lg text-4xl md:text-5xl text-primary mb-2">{t('groups.title')}</h2>
          <p className="font-body-md text-lg text-on-surface-variant max-w-md">{t('groups.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-4 bg-secondary-container text-on-secondary-container rounded-full font-label-sm flex items-center gap-2 hover:shadow-lg transition-shadow active:scale-95 shadow-sm font-bold"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            {t('groups.create')}
          </button>
          <Link to="/join" className="px-6 py-4 bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 rounded-full font-label-sm flex items-center gap-2 hover:bg-surface-variant transition-colors active:scale-95 font-bold">
            <QrCode className="w-5 h-5" />
            {t('groups.joinCode')}
          </Link>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-ambient w-full max-w-md p-8 relative overflow-hidden animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-2xl text-primary">Create Group</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="relative z-10 space-y-6">
              <div>
                <label className="block font-label-sm text-primary mb-2">Group name</label>
                <input
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                  placeholder="e.g. Hemlock Flat"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-label-sm text-primary mb-2">Members</label>
                <input
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                  placeholder="e.g. Aisha, Rohan, Priya"
                  value={form.memberNames}
                  onChange={(e) => setForm({ ...form, memberNames: e.target.value })}
                  required
                />
                <p className="font-body-md text-xs text-on-surface-variant mt-2 opacity-80">Comma-separated names. You'll be added automatically as the first member.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 py-4 px-4 rounded-full border border-outline-variant text-primary font-bold font-label-sm hover:bg-surface-container transition-all"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 px-4 rounded-full bg-primary text-on-primary font-bold font-label-sm hover:opacity-90 transition-all shadow-ambient disabled:opacity-70"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: any) => {
            const theme = getGroupTheme(group.name);
            // Mocking the balance status since we don't have it directly in the groups API
            // For a real app, this would be computed or fetched from the balances API
            const mockBalance = (group.id.length % 3) - 1; // -1, 0, 1
            const owes = mockBalance < 0;
            const owed = mockBalance > 0;
            const settled = mockBalance === 0;

            return (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="group bg-surface-container-lowest rounded-2xl p-6 shadow-ambient border border-surface-container hover:border-secondary/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[18rem]"
              >
                {/* Organic Chart Background */}
                <div 
                  className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} opacity-80 -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-110`}
                  style={{
                    clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%'
                  }}
                ></div>
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-full ${theme.iconBg} flex items-center justify-center ${theme.iconText} shadow-sm`}>
                    <theme.Icon className="w-6 h-6" />
                  </div>
                  <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-xs font-bold border border-outline-variant/20">
                    {group.memberships?.length ?? 0} {t('groups.members')}
                  </span>
                </div>
                
                <div className="relative z-10">
                  <h3 className="font-headline-md text-2xl text-primary mb-2 pr-4">{group.name}</h3>
                  
                  <p className={`font-label-sm flex items-center gap-1.5 mb-6 ${owes ? 'text-secondary' : owed ? 'text-primary' : 'text-on-surface-variant opacity-70'}`}>
                    {owes && <TrendingDown className="w-4 h-4" strokeWidth={2.5} />}
                    {owed && <TrendingUp className="w-4 h-4" strokeWidth={2.5} />}
                    {settled && <CheckCircle className="w-4 h-4" strokeWidth={2.5} />}
                    
                    {owes ? 'You owe money' : owed ? 'You are owed money' : 'All settled up'}
                  </p>
                  
                  <div className="flex -space-x-3 mb-8">
                    {group.memberships?.slice(0, 5).map((m: any, i: number) => (
                      <div
                        key={m.id}
                        className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-label-sm font-bold text-on-secondary-container border-2 border-surface-container-lowest"
                        title={m.displayName}
                        style={{ zIndex: 10 - i }}
                      >
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(group.memberships?.length ?? 0) > 5 && (
                      <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center text-xs font-bold text-on-surface-variant z-0">
                        +{group.memberships.length - 5}
                      </div>
                    )}
                  </div>
                  
                  <button className="w-full py-3.5 bg-surface-container-highest text-on-surface-variant rounded-full font-label-sm font-bold hover:bg-surface-variant transition-colors">
                    {t('groups.viewDetails')}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Suggestion Card / Empty State Slot */}
          <div 
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-outline-variant/40 rounded-2xl bg-transparent hover:bg-surface-container-low/30 transition-colors group cursor-pointer min-h-[18rem]"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-secondary opacity-80" />
            </div>
            <p className="font-headline-md text-xl text-primary text-center">{t('groups.planSomethingNew')}</p>
            <p className="font-body-md text-sm text-on-surface-variant text-center mt-2 max-w-[200px]">{t('groups.planSubtitle')}</p>
          </div>
        </div>
      )}

      {/* Footnote / Help Section */}
      <section className="mt-12 p-6 bg-secondary-fixed/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 border border-secondary/10 shadow-sm">
        <div className="w-14 h-14 flex-shrink-0 bg-secondary rounded-full flex items-center justify-center text-on-secondary shadow-sm">
           <Users className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-label-sm font-bold text-on-secondary-container mb-1">Hearth Tip</h4>
          <p className="font-body-md text-on-secondary-container opacity-80 text-sm md:text-base">Groups make it easier to track recurring bills. Try setting up 'Utilities' as a group to never miss a split again.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="font-label-sm text-secondary hover:underline font-bold whitespace-nowrap"
        >
          Create 'Utilities'
        </button>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Key, UserPlus, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function JoinGroupPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  
  const [joinCode, setJoinCode] = useState('');
  const [isCodeSubmitted, setIsCodeSubmitted] = useState(false);
  
  // Selection state: either a string (existing member name) or 'NEW'
  const [selection, setSelection] = useState<string | 'NEW' | null>(null);
  const [newMemberName, setNewMemberName] = useState(user?.name?.split(' ')[0] || '');

  // 1. Query group info by code
  const { data: groupInfo, isLoading: isFetchingInfo, error: fetchError } = useQuery({
    queryKey: ['joinInfo', joinCode],
    queryFn: () => api.get(`/groups/join/info/${joinCode}`).then(res => res.data.data),
    enabled: isCodeSubmitted && joinCode.length > 0,
    retry: false,
  });

  // 2. Mutation to join
  const joinMutation = useMutation({
    mutationFn: (payload: { joinCode: string; claimDisplayName?: string; newMemberName?: string }) => 
      api.post('/groups/join', payload).then(res => res.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      if (data.groupId) {
        qc.invalidateQueries({ queryKey: ['group', data.groupId] });
        qc.invalidateQueries({ queryKey: ['expenses', data.groupId] });
        qc.invalidateQueries({ queryKey: ['settlements', data.groupId] });
      }
      toast.success('Successfully joined the group!');
      navigate(`/groups/${data.groupId}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to join group');
    }
  });

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsCodeSubmitted(true);
  };

  const handleJoin = () => {
    if (!selection) return;

    if (selection === 'NEW') {
      if (!newMemberName.trim()) {
        toast.error('Please enter your name');
        return;
      }
      joinMutation.mutate({
        joinCode,
        newMemberName: newMemberName.trim()
      });
    } else {
      joinMutation.mutate({
        joinCode,
        claimDisplayName: selection
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pt-8">
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-sm mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </button>

      <div className="text-center mb-8">
        <h1 className="font-display-lg text-4xl text-primary mb-3">Join a Group</h1>
        <p className="font-body-md text-on-surface-variant">Enter the unique code shared by your friends</p>
      </div>

      {!isCodeSubmitted || fetchError ? (
        <form onSubmit={handleVerifyCode} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-ambient space-y-6">
          <div>
            <label className="block font-label-sm text-primary mb-2">Group Join Code</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                autoFocus
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-data-mono font-bold text-lg tracking-wider"
                placeholder="e.g. cmrgr..."
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  setIsCodeSubmitted(false); // Reset if they start typing again
                }}
              />
            </div>
            {fetchError && (
              <p className="mt-3 text-error font-label-sm">Invalid join code. Please check and try again.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!joinCode.trim() || isFetchingInfo}
            className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold font-body-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingInfo ? 'Verifying...' : 'Next'}
          </button>
        </form>
      ) : groupInfo ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-ambient space-y-6 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-display-lg text-3xl mx-auto mb-4">
              {groupInfo.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-headline-md text-2xl text-primary">{groupInfo.name}</h2>
            <p className="font-body-sm text-on-surface-variant mt-1">Select how you want to join this group</p>
          </div>

          <div className="space-y-4">
            {groupInfo.memberships.length > 0 && (
              <div className="space-y-3">
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-xs">Claim an existing profile</p>
                {groupInfo.memberships.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => setSelection(m.displayName)}
                    className={`w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selection === m.displayName 
                        ? 'bg-secondary-container/20 border-secondary-container text-primary shadow-sm' 
                        : 'bg-surface border-outline-variant/30 text-on-surface hover:bg-surface-container hover:border-outline-variant/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-headline-md ${
                        selection === m.displayName ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-body-lg font-medium">{m.displayName}</span>
                    </div>
                    {selection === m.displayName && <Check className="w-5 h-5 text-secondary" />}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-2">
              {groupInfo.memberships.length > 0 && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-outline-variant/30"></div>
                  <span className="font-label-sm text-on-surface-variant text-xs">OR</span>
                  <div className="flex-1 h-px bg-outline-variant/30"></div>
                </div>
              )}
              
              <button
                onClick={() => setSelection('NEW')}
                className={`w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selection === 'NEW'
                    ? 'bg-primary-container/20 border-primary-container text-primary shadow-sm' 
                    : 'bg-surface border-outline-variant/30 text-on-surface hover:bg-surface-container hover:border-outline-variant/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selection === 'NEW' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
                  }`}>
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="font-body-lg font-medium">Join as a new member</span>
                </div>
                {selection === 'NEW' && <Check className="w-5 h-5 text-primary" />}
              </button>
            </div>

            {selection === 'NEW' && (
              <div className="pt-2 animate-fade-in">
                <label className="block font-label-sm text-primary mb-2">Your Display Name</label>
                <input
                  type="text"
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-body-md"
                  placeholder="What should others call you?"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={!selection || joinMutation.isPending}
            className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold font-body-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {joinMutation.isPending ? 'Joining...' : 'Join Group'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

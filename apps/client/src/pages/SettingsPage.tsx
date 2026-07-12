import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Bell, Shield, Download, Trash2, ChevronRight, X,
  Sun, Moon, Globe, CreditCard, Eye, EyeOff, LogOut,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useI18nStore } from '@/store/i18nStore';
import { Language } from '@/lib/translations';

// ─── Local preferences stored in localStorage ────────────────────────────────
const PREFS_KEY = 'hearth-preferences';

interface Preferences {
  currency: 'INR' | 'USD';
  language: string;
  theme: 'light' | 'dark';
  notifyNewExpense: boolean;
  notifySettlement: boolean;
  notifyGroupActivity: boolean;
}

const defaultPrefs: Preferences = {
  currency: 'INR',
  language: 'English (UK)',
  theme: 'light',
  notifyNewExpense: true,
  notifySettlement: true,
  notifyGroupActivity: false,
};

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(p: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/40 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-ambient w-full max-w-md p-8 relative animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-md text-xl text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useI18n();
  const setLanguage = useI18nStore((s) => s.setLanguage);

  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Edit profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' });

  // Change password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  // Delete form
  const [deletePassword, setDeletePassword] = useState('');

  // Persist preferences whenever they change
  useEffect(() => { savePrefs(prefs); }, [prefs]);

  // Apply theme to <html> element immediately whenever theme pref changes
  useEffect(() => {
    const html = document.documentElement;
    if (prefs.theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [prefs.theme]);

  // Apply language to <html lang> attribute whenever language pref changes
  useEffect(() => {
    const langMap: Record<string, string> = {
      'English (UK)': 'en-GB',
      'English (US)': 'en-US',
      'Hindi': 'hi',
      'Marathi': 'mr',
    };
    document.documentElement.lang = langMap[prefs.language] ?? 'en-GB';
  }, [prefs.language]);

  // Apply saved theme on first load
  useEffect(() => {
    const saved = loadPrefs();
    if (saved.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const updatePref = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    if (key === 'theme') {
      toast.success(`Switched to ${value === 'dark' ? '🌙 Dark' : '☀️ Light'} mode`);
    }
    if (key === 'language') {
      setLanguage(value as Language);
      toast.success(`Language set to ${value}`);
    }
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const profileMutation = useMutation({
    mutationFn: (data: object) => api.patch('/auth/profile', data).then((r) => r.data.data),
    onSuccess: (updatedUser) => {
      setAuth(updatedUser, useAuthStore.getState().token!);
      setShowEditProfile(false);
      toast.success('Profile updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: object) => api.post('/auth/change-password', data),
    onSuccess: () => {
      setShowChangePassword(false);
      setPwForm({ current: '', next: '', confirm: '' });
      toast.success('Password changed successfully!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to change password'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (data: object) => api.delete('/auth/account', { data }),
    onSuccess: () => {
      clearAuth();
      toast.success('Account deleted');
      navigate('/login');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete account'),
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
    toast.success('Logged out');
  };

  const handleExportCSV = () => {
    const token = useAuthStore.getState().token;
    const link = document.createElement('a');
    const baseUrl = import.meta.env.VITE_API_URL || '';
    link.href = `${baseUrl}/api/auth/export`;
    // Trigger download with Bearer token via fetch
    fetch(`${baseUrl}/api/auth/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'hearth-export.csv';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Export downloaded!');
      })
      .catch(() => toast.error('Export failed'));
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name: profileForm.name, email: profileForm.email });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.next });
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    deleteAccountMutation.mutate({ password: deletePassword });
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">{t('settings.title')}</h1>
        <p className="font-body-md text-on-surface-variant">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column (2/3) ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-ambient p-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline-md font-bold text-2xl border border-outline-variant/30">
                  {initials}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline-md text-xl text-primary truncate">{user?.name}</p>
                <p className="font-body-md text-on-surface-variant text-sm truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setProfileForm({ name: user?.name ?? '', email: user?.email ?? '' }); setShowEditProfile(true); }}
                className="flex-shrink-0 px-5 py-2.5 rounded-full border border-outline-variant text-primary font-label-sm hover:bg-surface-container transition-all"
              >
                {t('settings.editProfile')}
              </button>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-ambient p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h2 className="font-headline-md text-xl text-primary">{t('settings.notifications')}</h2>
            </div>
            <div className="space-y-5">
              {[
                {
                  key: 'notifyNewExpense' as const,
                  label: t('settings.notifyNewExpense'),
                  sublabel: t('settings.notifyNewExpenseDesc'),
                },
                {
                  key: 'notifySettlement' as const,
                  label: t('settings.notifySettlement'),
                  sublabel: t('settings.notifySettlementDesc'),
                },
                {
                  key: 'notifyGroupActivity' as const,
                  label: t('settings.notifyGroupActivity'),
                  sublabel: t('settings.notifyGroupActivityDesc'),
                },
              ].map(({ key, label, sublabel }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-label-sm text-primary">{label}</p>
                    <p className="font-body-md text-sm text-on-surface-variant">{sublabel}</p>
                  </div>
                  <Toggle checked={prefs[key]} onChange={(v) => updatePref(key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row: Export + Danger Zone */}
          <div className="space-y-4">
            {/* Export CSV */}
            <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-sm text-primary">{t('settings.exportData')}</p>
                <p className="font-body-md text-sm text-on-surface-variant">{t('settings.exportDataDesc')}</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex-shrink-0 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-sm hover:opacity-90 transition-all whitespace-nowrap"
              >
                Export CSV
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-error-container/30 border border-error/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-error" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-sm text-error">Danger Zone</p>
                <p className="font-body-md text-sm text-on-surface-variant">This action is permanent and cannot be undone.</p>
              </div>
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="flex-shrink-0 px-5 py-2.5 bg-error text-on-error rounded-xl font-label-sm hover:opacity-90 transition-all whitespace-nowrap"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column (1/3) ──────────────────────────────────── */}
        <div className="space-y-6">

          {/* Preferences */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-ambient p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h2 className="font-headline-md text-xl text-primary">Preferences</h2>
            </div>

            {/* Default Currency */}
            <div className="mb-5">
              <p className="font-label-sm text-on-surface-variant mb-2">Default Currency</p>
              <div className="flex rounded-full overflow-hidden border border-outline-variant/40 w-full">
                {(['INR', 'USD'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => updatePref('currency', c)}
                    className={`flex-1 py-2.5 font-label-sm text-sm transition-all ${
                      prefs.currency === c
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {c === 'INR' ? 'INR (₹)' : 'USD ($)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <p className="font-label-sm text-on-surface-variant mb-2">Language</p>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <select
                  value={prefs.language}
                  onChange={(e) => updatePref('language', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface text-on-surface border border-outline-variant/50 rounded-lg font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                >
                  {['English (UK)', 'English (US)', 'Hindi', 'Marathi'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-ambient p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h2 className="font-headline-md text-xl text-primary">Security</h2>
            </div>

            {/* Change Password */}
            <button
              onClick={() => { setPwForm({ current: '', next: '', confirm: '' }); setShowChangePassword(true); }}
              className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 hover:border-primary/30 hover:bg-surface-container transition-all mb-3 text-left"
            >
              <div>
                <p className="font-label-sm text-primary">Change Password</p>
                <p className="font-body-md text-xs text-on-surface-variant">Update your login credentials</p>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
            </button>

            {/* 2FA (cosmetic badge) */}
            <div className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 mb-5">
              <div>
                <p className="font-label-sm text-primary">Two-Factor Auth</p>
                <p className="font-body-md text-xs text-on-surface-variant">Enhanced account protection</p>
              </div>
              <span className="px-2.5 py-1 bg-secondary text-on-secondary rounded-full font-label-sm text-xs">ENABLED</span>
            </div>

            {/* Theme */}
            <div>
              <p className="font-label-sm text-on-surface-variant mb-3">Theme Preference</p>
              <div className="flex gap-3">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updatePref('theme', t)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-label-sm text-sm transition-all ${
                      prefs.theme === t
                        ? 'border-primary bg-surface-container-lowest text-primary'
                        : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/30'
                    }`}
                  >
                    {t === 'light' ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-outline-variant/40 text-on-surface-variant font-label-sm hover:bg-surface-container hover:text-primary transition-all"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 text-center font-body-md text-sm text-on-surface-variant/60">
        © {new Date().getFullYear()} The Hearth. Built for care. &nbsp;
        <span className="underline cursor-pointer hover:text-on-surface-variant">Privacy</span>&nbsp;·&nbsp;
        <span className="underline cursor-pointer hover:text-on-surface-variant">Terms</span>&nbsp;·&nbsp;
        <span className="underline cursor-pointer hover:text-on-surface-variant">Community Guidelines</span>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <Modal title="Edit Profile" onClose={() => setShowEditProfile(false)}>
          <form onSubmit={handleProfileSave} className="space-y-5">
            <div>
              <label className="block font-label-sm text-primary mb-1.5">Name</label>
              <input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 font-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="block font-label-sm text-primary mb-1.5">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 font-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditProfile(false)} className="flex-1 py-3 rounded-full border border-outline-variant text-primary font-label-sm hover:bg-surface-container transition-all">
                Cancel
              </button>
              <button type="submit" disabled={profileMutation.isPending} className="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-sm hover:opacity-90 transition-all disabled:opacity-60">
                {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <Modal title="Change Password" onClose={() => setShowChangePassword(false)}>
          <form onSubmit={handleChangePassword} className="space-y-5">
            {[
              { label: 'Current Password', key: 'current' as const, show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
              { label: 'New Password', key: 'next' as const, show: showNext, toggle: () => setShowNext((v) => !v) },
              { label: 'Confirm New Password', key: 'confirm' as const, show: showNext, toggle: () => setShowNext((v) => !v) },
            ].map(({ label, key, show, toggle }) => (
              <div key={key}>
                <label className="block font-label-sm text-primary mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={pwForm[key]}
                    onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                    className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 pr-10 py-3 font-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowChangePassword(false)} className="flex-1 py-3 rounded-full border border-outline-variant text-primary font-label-sm hover:bg-surface-container transition-all">
                Cancel
              </button>
              <button type="submit" disabled={changePasswordMutation.isPending} className="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-sm hover:opacity-90 transition-all disabled:opacity-60">
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <Modal title="Delete Account" onClose={() => setShowDeleteAccount(false)}>
          <div className="mb-5 p-4 bg-error-container/30 border border-error/20 rounded-xl">
            <p className="font-label-sm text-error mb-1">This action is permanent</p>
            <p className="font-body-md text-sm text-on-surface-variant">All your groups, expenses, and settlements will be deleted forever. There is no undo.</p>
          </div>
          <form onSubmit={handleDeleteAccount} className="space-y-5">
            <div>
              <label className="block font-label-sm text-primary mb-1.5">Enter your password to confirm</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
                className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg px-4 py-3 font-body-md focus:outline-none focus:ring-2 focus:ring-error/30"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowDeleteAccount(false)} className="flex-1 py-3 rounded-full border border-outline-variant text-primary font-label-sm hover:bg-surface-container transition-all">
                Cancel
              </button>
              <button type="submit" disabled={deleteAccountMutation.isPending} className="flex-1 py-3 rounded-full bg-error text-on-error font-label-sm hover:opacity-90 transition-all disabled:opacity-60">
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

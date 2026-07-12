import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Users, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/hooks/useI18n';

export function AppLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/activity', label: t('nav.activity'), icon: Activity },
    { to: '/groups', label: t('nav.groups'), icon: Users },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-surface text-on-surface antialiased w-full relative">
      {/* Removed texture overlay */}

      {/* Top Navigation (Mobile Only) */}
      <header className="md:hidden bg-surface flex justify-between items-center w-full px-container-padding-mobile py-4 fixed top-0 z-40 border-b border-surface-variant/50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="The Hearth" className="w-8 h-8 rounded-xl object-cover" />
          <span className="font-headline-md text-xl font-semibold text-primary">The Hearth</span>
        </div>
      </header>

      {/* Side Navigation (Desktop Only) */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest flex-col p-6 shadow-[20px_0_40px_rgba(45,67,61,0.05)] z-40 border-r border-outline-variant/30">
        <div className="mb-8">
          <div className="font-headline-md text-2xl font-bold text-primary mb-8 cursor-pointer flex items-center gap-3" onClick={() => navigate('/')}>
             <img src="/logo.png" alt="The Hearth" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
             The Hearth
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold font-headline-md shadow-sm border border-outline-variant/30">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-label-sm text-primary truncate">{t('common.welcomeBack')} {user?.name?.split(' ')[0]}</h2>
              <p className="font-body-md text-on-surface-variant text-sm truncate">{t('common.yourSharedHome')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 mt-4">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive: isExactActive }) =>
                  `flex items-center gap-4 px-6 py-3 rounded-full font-label-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full md:ml-64 pt-20 md:pt-6 px-container-padding-mobile md:px-container-padding-desktop pb-24 md:pb-12 max-w-[1100px] mx-auto min-h-screen relative z-10 animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest border-t border-tertiary-fixed shadow-[0_-10px_20px_rgba(45,67,61,0.05)] z-50 px-6 py-3 flex justify-between items-center pb-[max(env(safe-area-inset-bottom),12px)]">
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-secondary-container/20' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'fill-secondary-container/20 stroke-primary' : ''}`} />
              </div>
              <span className={`font-label-sm text-[10px] ${isActive ? 'font-bold' : ''}`}>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

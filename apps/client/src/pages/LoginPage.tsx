import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Receipt, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.token);
      toast.success(`Welcome back, ${data.data.user.name}!`);
      navigate('/');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <main className="w-full max-w-[1100px] mx-auto px-container-padding-mobile md:px-container-padding-desktop flex flex-col md:flex-row items-center justify-center gap-stack-lg z-10 py-12 min-h-screen">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full max-w-lg">
        <div className="mb-stack-md self-center md:self-start">
          <img src="/logo.png" alt="The Hearth" className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] object-cover shadow-ambient" />
        </div>
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-stack-sm leading-tight">
          Welcome to <br className="hidden md:block" />The Hearth.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          Shared life, simple math. A space for partners, friends, and roommates to manage shared expenses without the clinical finance stress.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-ambient p-8 border border-outline-variant/30 relative overflow-hidden animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-stack-md">
          <div className="text-center md:text-left mb-2">
            <h2 className="font-headline-md text-headline-md text-primary">Welcome Back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Step into your shared space.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-label-sm text-primary mb-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="email"
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-sm text-primary mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-4 px-6 rounded-DEFAULT bg-primary text-on-primary font-bold font-body-lg hover:opacity-90 transition-all shadow-ambient flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              <span>{mutation.isPending ? 'Signing in...' : 'Sign in'}</span>
              {!mutation.isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-4 pt-6 border-t border-outline-variant/30 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-secondary font-bold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

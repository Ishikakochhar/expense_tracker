import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Receipt, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.token);
      toast.success('Account created successfully!');
      navigate('/');
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === 'string') {
        toast.error(errorMsg);
      } else if (errorMsg?.fieldErrors) {
        const firstError = Object.values(errorMsg.fieldErrors)[0] as string[];
        toast.error(firstError[0] || 'Invalid input');
      } else {
        toast.error('Registration failed');
      }
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
          Join <br className="hidden md:block" />The Hearth.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          Start sharing expenses with clarity. Whether it's rent, groceries, or a weekend trip, we'll keep the math simple.
        </p>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-ambient p-8 border border-outline-variant/30 relative overflow-hidden animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-stack-md">
          <div className="text-center md:text-left mb-2">
            <h2 className="font-headline-md text-headline-md text-primary">Create Account</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Get started in seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-label-sm text-primary mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="text"
                  className="w-full bg-surface text-on-surface border border-outline-variant/50 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

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
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 ml-1">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-4 px-6 rounded-DEFAULT bg-primary text-on-primary font-bold font-body-lg hover:opacity-90 transition-all shadow-ambient flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
            >
              <span>{mutation.isPending ? 'Creating account...' : 'Create account'}</span>
              {!mutation.isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-2 pt-6 border-t border-outline-variant/30 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

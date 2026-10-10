'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.user.role === 'ADMIN') {
          setError('Admins must use the dedicated Admin Portal to log in.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }

        if (response.data.user.role === 'FACULTY') {
          router.push('/faculty/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-variant p-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 w-32 h-32 bg-primary-fixed/30 rounded-full blur-2xl"></div>
      
      <div className="mb-8 text-center relative z-10">
        <div className="mx-auto w-12 h-12 bg-primary-fixed/40 text-primary rounded-xl flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[24px]">login</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Welcome back</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Sign in to your AptiRush account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-container/40 text-error font-body-sm text-body-sm border border-error-container relative z-10 flex items-center">
          <span className="material-symbols-outlined text-base mr-2">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5 relative z-10">
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md shadow-inner"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="password">
              Password
            </label>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md shadow-inner"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-sm font-label-lg text-label-lg text-on-primary bg-primary hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-6 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center font-body-md text-body-sm text-on-surface-variant relative z-10">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/register', { name, email, password });
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-variant p-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -left-16 w-32 h-32 bg-secondary-fixed/30 rounded-full blur-2xl"></div>
      
      <div className="mb-8 text-center relative z-10">
        <div className="mx-auto w-12 h-12 bg-secondary-fixed/40 text-secondary rounded-xl flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[24px]">person_add</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Create Account</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Join AptiRush today</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-container/40 text-error font-body-sm text-body-sm border border-error-container relative z-10 flex items-center">
          <span className="material-symbols-outlined text-base mr-2">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5 relative z-10">
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:bg-surface-container-low focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all font-body-md shadow-inner"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:bg-surface-container-low focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all font-body-md shadow-inner"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:bg-surface-container-low focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all font-body-md shadow-inner"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-sm font-label-lg text-label-lg text-on-secondary bg-secondary hover:bg-secondary-container disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-6 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <p className="mt-8 text-center font-body-md text-body-sm text-on-surface-variant relative z-10">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-secondary hover:underline transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}

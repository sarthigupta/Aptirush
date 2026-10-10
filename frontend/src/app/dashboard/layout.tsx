'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
    } else if (userDataStr) {
      try {
        setUser(JSON.parse(userDataStr));
      } catch(e) {}
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { name: 'Lobby', href: '/dashboard' },
    { name: '1v1 Arena', href: '/dashboard/battle' },
    { name: 'My Tests', href: '/dashboard/tests' },
    { name: 'Leaderboard', href: '/dashboard/performance' },
  ];

  if (!user) return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-surface flex flex-col w-full text-on-surface antialiased">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-[1120px] mx-auto px-gutter flex items-center justify-between gap-space-md">
          
          <div className="flex items-center gap-space-sm flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-space-xs">
              <span className="font-title-md text-title-md font-semibold tracking-tight text-on-surface">AptiRush</span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Practice & Arena</span>
          </div>

          <nav className="hidden md:flex items-center gap-space-xs p-space-xs rounded-xl bg-surface-container-low/60">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-space-md py-space-xs rounded-lg transition-colors font-label-lg text-label-lg ${
                    isActive
                      ? 'bg-surface-container text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-space-sm flex-shrink-0">
            <div className="hidden lg:flex items-center px-space-sm py-space-xs rounded-full bg-surface-container-lowest shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
              <span className="font-label-md text-label-md text-on-surface-variant">Diamond II <span class="text-outline-variant mx-space-xs">•</span> <span className="font-semibold text-primary">1,840 MMR</span></span>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-tertiary-fixed/40 text-tertiary font-label-md text-label-md">
              <span className="material-symbols-outlined text-base leading-none text-tertiary-container">local_fire_department</span>
              <span>5 Streak</span>
            </div>
            <div className="pl-space-xs cursor-pointer" onClick={handleLogout} title="Logout">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold text-xs ring-2 ring-surface-container-highest">
                {user?.name?.substring(0,2).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-140px)] flex-1">
        {children}
      </main>
      
      <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_6px_rgba(0,0,0,0.02)] mt-space-xxl">
        <div className="max-w-[1120px] mx-auto px-gutter py-space-xl flex flex-col md:flex-row items-center justify-between gap-space-md text-center md:text-left">
          <div className="flex flex-col gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">AptiRush</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">A serene cognitive arena designed for mindful quantitative, logical, and verbal head-to-head challenges.</p>
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">
            © 2025 AptiRush. All cognitive rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

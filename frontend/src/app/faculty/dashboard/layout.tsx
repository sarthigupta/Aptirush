'use client';

import { LayoutDashboard, Users, FileText, LogOut, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FacultyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'FACULTY') {
      router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      return;
    }
    setUserName(user.name);
  }, [router]);

  const navItems = [
    { name: 'Overview', href: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Students', href: '/faculty/dashboard/students', icon: Users },
    { name: 'Manage Tests', href: '/faculty/dashboard/tests', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <FileSignature className="w-6 h-6 text-gray-900 mr-2" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Faculty Portal</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center px-3 py-2.5 mb-2 rounded-lg bg-gray-50">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{userName}</p>
              <p className="text-xs text-gray-500">Faculty</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:hidden">
           <div className="flex items-center">
             <FileSignature className="w-6 h-6 text-gray-900 mr-2" />
             <h1 className="text-xl font-bold tracking-tight text-gray-900">Faculty Portal</h1>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

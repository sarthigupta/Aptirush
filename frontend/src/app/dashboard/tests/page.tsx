'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MyTestsPage() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModules() {
      try {
        const res = await api.get('/student/modules');
        setModules(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchModules();
  }, []);

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1120px] mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-xl relative">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Practice Modules</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Select an experience tuned to your current mental headspace.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-primary">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Syncing Data...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg text-center shadow-sm">
            <p className="font-body-md text-on-surface-variant">No modules available yet. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {modules.map((mod, index) => (
              <div key={mod.id} className="group relative rounded-xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[26px]">menu_book</span>
                    </div>
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">Module {mod.chapterNumber || index + 1}</span>
                  </div>
                  <h3 className="font-title-md text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors">{mod.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Includes {mod._count?.questions || 0} challenging analytical sequences designed to enhance your cognitive flow.</p>
                </div>
                <div className="pt-space-lg flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Self-Paced</span>
                  </div>
                  <button 
                    onClick={() => router.push(`/dashboard/quiz/${mod.id}`)}
                    className="px-space-md py-space-xs rounded-lg bg-surface-container font-label-lg text-label-lg text-primary hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    Enter Module
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

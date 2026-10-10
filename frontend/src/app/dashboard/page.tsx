'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      try {
        setUser(JSON.parse(userDataStr));
      } catch(e) {}
    }

    Promise.all([
      api.get('/student/dashboard-stats'),
      api.get('/student/custom-tests')
    ])
      .then(([statsRes, testsRes]) => {
        setData(statsRes.data);
        setAssignedTests(testsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
        <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Syncing Data...</span>
      </div>
    );
  }

  const averageScore = data?.stats?.averageScore || '0%';
  const testsCompleted = data?.stats?.testsCompleted || '0';
  const timeSpent = data?.stats?.timeSpent || '0h';
  const recentTests = data?.recentTests || [];

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1120px] mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-xl">
        
        {/* Warm Welcome */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm transition-all duration-300">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-primary-fixed/30 via-secondary-fixed/20 to-transparent blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-xl">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  Lobby Status Online
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Good morning, {user?.name || 'Student'}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Sharpen your analytical instincts in peaceful head-to-head duels. Take a deep breath, observe patterns, and play with poise.</p>
              
              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">Preferred Disciplines:</span>
                <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-md text-label-md text-primary hover:bg-surface-container-high transition-colors cursor-pointer">Quantitative</span>
                <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-md text-label-md text-primary hover:bg-surface-container-high transition-colors cursor-pointer">Logical Reasoning</span>
                <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-md text-label-md text-primary hover:bg-surface-container-high transition-colors cursor-pointer">Data Interpretation</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-space-sm w-full lg:w-auto">
              <button onClick={() => router.push('/dashboard/battle')} className="flex items-center justify-center gap-space-sm px-space-lg py-space-sm bg-primary text-on-primary rounded-xl font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                <span>Find 1v1 Match</span>
              </button>
              <button onClick={() => router.push('/dashboard/tests')} className="flex items-center justify-center gap-space-sm px-space-lg py-space-sm bg-surface-container text-on-surface rounded-xl font-label-lg text-label-lg hover:bg-surface-container-high transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">auto_stories</span>
                <span>Practice Modules</span>
              </button>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* MMR Progress Card (5 cols) */}
          <div className="lg:col-span-5 rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Cognitive Tier</span>
                <span className="font-title-md text-title-md font-semibold text-on-surface">Diamond II Rating</span>
              </div>
              <span className="px-space-sm py-space-xs rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">Tier 4 / 6</span>
            </div>
            <div className="my-space-md flex items-center justify-around gap-space-md">
              <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle className="text-surface-container-high" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="7"></circle>
                  <circle className="text-primary transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeDasharray="263.89" strokeDashoffset="47.5" strokeLinecap="round" strokeWidth="7"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-headline-md font-bold text-on-surface leading-none">1,840</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">MMR</span>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  <span>+34 MMR today</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">82% toward <span className="font-semibold text-on-surface">Master Tier</span></p>
                <div className="w-36 bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{width: '82%'}}></div>
                </div>
                <span className="font-label-sm text-label-sm text-outline">160 MMR needed</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary mb-space-sm">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Average Score</span>
                <div className="font-headline-md text-headline-md font-semibold text-on-surface">{averageScore}</div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-sm">
                <span className="material-symbols-outlined text-[20px]">sports_martial_arts</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Tests Completed</span>
                <div className="font-headline-md text-headline-md font-semibold text-on-surface">{testsCompleted}</div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary mb-space-sm">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Time in Combat</span>
                <div className="font-headline-md text-headline-md font-semibold text-on-surface">{timeSpent}</div>
              </div>
            </div>
            
            <div className="col-span-2 sm:col-span-4 rounded-xl bg-surface-container-low p-space-md flex items-center justify-between gap-space-md mt-auto">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">psychology</span>
                <div>
                  <p className="font-title-md text-body-md font-semibold text-on-surface">Mental Flow Accuracy Index</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">High precision sustained recently.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 h-8">
                <div className="w-2.5 bg-primary/20 rounded-full h-3"></div>
                <div className="w-2.5 bg-primary/30 rounded-full h-5"></div>
                <div className="w-2.5 bg-primary/40 rounded-full h-4"></div>
                <div className="w-2.5 bg-primary/60 rounded-full h-6"></div>
                <div className="w-2.5 bg-primary/80 rounded-full h-7"></div>
                <div className="w-2.5 bg-primary rounded-full h-8"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Assigned Faculty Tests */}
        <section className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Active Assignments</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Challenges assigned by your faculty.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {assignedTests.length === 0 ? (
              <div className="col-span-3 p-space-lg text-center font-body-md text-on-surface-variant bg-surface-container-lowest rounded-xl shadow-sm">No pending tests assigned.</div>
            ) : assignedTests.map((test, index) => {
              const attempted = test.attempts && test.attempts.length > 0;
              return (
                <div key={test.id} className="group relative rounded-xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[26px]">assignment</span>
                      </div>
                      <span className={`px-space-sm py-0.5 rounded-full ${attempted ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-primary'} font-label-sm text-label-sm font-semibold`}>
                        {attempted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <h3 className="font-title-md text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors">{test.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{test.questions.length} questions included in this assignment.</p>
                  </div>
                  <div className="pt-space-lg flex items-center justify-between mt-auto">
                    {!attempted ? (
                      <button 
                        onClick={() => router.push(`/dashboard/quiz/${test.id}?type=custom`)}
                        className="px-space-md py-space-xs rounded-lg bg-surface-container font-label-lg text-label-lg text-primary hover:bg-primary hover:text-on-primary transition-colors ml-auto"
                      >
                        Enter Challenge
                      </button>
                    ) : (
                      <span className="ml-auto font-label-md text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-sm">check</span> Done</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

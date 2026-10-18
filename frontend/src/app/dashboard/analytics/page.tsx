'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, mistakesRes] = await Promise.all([
          api.get('/student/analytics'),
          api.get('/student/mistake-vault')
        ]);
        setAnalytics(analyticsRes.data);
        setMistakes(mistakesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
        <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Compiling Metrics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full relative min-h-[calc(100vh-140px)]">
      <div className="max-w-[1120px] mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-xl">
        
        {/* Header */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span className="material-symbols-outlined text-base">monitoring</span>
            <span className="tracking-wide">PERFORMANCE INSIGHTS</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Analytics & Mistake Vault</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Identify your weak spots and review incorrect answers to improve your cognitive flow.</p>
        </div>

        {/* Top Gamification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* Streak Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/30 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">local_fire_department</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Current Login Streak</span>
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {analytics?.currentStreak || 0} <span className="font-body-sm text-on-surface-variant font-normal">days</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Longest streak: {analytics?.longestStreak || 0} days.</p>
          </div>

          {/* Weakness Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-error-container/30 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">trending_down</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Primary Weakness</span>
              <div className="font-headline-md text-headline-md text-on-surface font-bold text-error">
                {analytics?.weakness || 'None Detected'}
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Focus your practice sessions here.</p>
          </div>

          {/* Daily Quest */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">assignment_turned_in</span>
                <span className="font-title-md text-title-md font-semibold text-on-surface">Daily Quest</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold">{Math.min(2, analytics?.testsCompletedToday || 0)} / 2</span>
            </div>
            <div className="mt-4">
              <p className="font-body-md text-body-md text-on-surface-variant mb-2">Complete 2 Practice Modules today.</p>
              <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{width: `${Math.min(100, ((analytics?.testsCompletedToday || 0) / 2) * 100)}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mistake Vault */}
        <div className="flex flex-col gap-space-md mt-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Mistake Vault</h2>
            <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{mistakes.length} Recorded</span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-variant overflow-hidden">
            {mistakes.length === 0 ? (
              <div className="p-space-xl text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-4">task_alt</span>
                <p className="font-body-lg text-body-lg text-on-surface">Your vault is empty.</p>
                <p className="font-body-sm text-on-surface-variant mt-1">You haven't made any recorded mistakes yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-container-low">
                {mistakes.map((mistake, idx) => (
                  <div key={mistake.id} className="p-space-lg hover:bg-surface-container-lowest/50 transition-colors">
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase">{mistake.type} FORMAT</span>
                      <span className="font-label-sm text-on-surface-variant">{new Date(mistake.date).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="font-title-md text-title-md text-on-surface mb-space-md font-medium">
                      {idx + 1}. {mistake.questionText}
                    </p>

                    {mistake.type === 'MCQ' && mistake.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mb-space-md">
                        {Object.entries(mistake.options).map(([key, val]) => (
                          <div 
                            key={key} 
                            className={`p-3 rounded-xl border ${
                              key === mistake.correctAnswer 
                                ? 'border-secondary bg-secondary-container/20 text-secondary-container' 
                                : key === mistake.userAnswer
                                ? 'border-error bg-error-container/20 text-error'
                                : 'border-outline-variant/30 text-on-surface-variant'
                            }`}
                          >
                            <span className="font-bold mr-2">{key}.</span>
                            <span>{String(val)}</span>
                            {key === mistake.correctAnswer && <span className="float-right material-symbols-outlined text-sm text-secondary">check_circle</span>}
                            {key === mistake.userAnswer && <span className="float-right material-symbols-outlined text-sm text-error">cancel</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {mistake.type === 'TITA' && (
                      <div className="flex flex-col sm:flex-row gap-space-md mb-space-md">
                        <div className="flex-1 p-3 rounded-xl border border-error bg-error-container/20 text-error flex items-center justify-between">
                          <div>
                            <span className="font-label-sm block uppercase tracking-wider mb-1">Your Answer</span>
                            <span className="font-bold">{mistake.userAnswer}</span>
                          </div>
                          <span className="material-symbols-outlined">cancel</span>
                        </div>
                        <div className="flex-1 p-3 rounded-xl border border-secondary bg-secondary-container/20 text-secondary-container flex items-center justify-between">
                          <div>
                            <span className="font-label-sm block uppercase tracking-wider mb-1">Correct Answer</span>
                            <span className="font-bold">{mistake.correctAnswer}</span>
                          </div>
                          <span className="material-symbols-outlined">check_circle</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggle: 'current' (Rolling 12-13 Months up to today) or 'previous' (Previous Year)
  const [viewPeriod, setViewPeriod] = useState<'current' | 'previous'>('current');
  const [hoveredCell, setHoveredCell] = useState<{ dateStr: string; count: number; formattedDate: string } | null>(null);

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

  // Compute Month-by-Month clusters:
  // 13 month clusters from past month of previous year up to current month (e.g. Oct -> Oct)
  // Each day automatically fills into its month cluster up to today
  const { monthsData, totalActiveDays, consistencyRate, periodLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // If 'previous', shift back by 1 year (12 months)
    const monthOffset = viewPeriod === 'previous' ? 12 : 0;

    // Generate 10 month clusters
    const generatedMonths: {
      year: number;
      month: number;
      monthName: string;
      columns: ({ day: number; dateStr: string; count: number; level: number; isToday: boolean } | null)[][];
    }[] = [];

    let activeCount = 0;
    let eligibleDays = 0;

    for (let i = 0; i < 10; i++) {
      const targetDate = new Date(currentYear, currentMonth - 9 - monthOffset + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const monthName = targetDate.toLocaleString('default', { month: 'short' });

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat

      const isCurrentMonth = viewPeriod === 'current' && year === currentYear && month === currentMonth;
      const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

      const totalSlots = firstDayOfWeek + maxDay;
      const numCols = Math.ceil(totalSlots / 7);

      const columns: ({ day: number; dateStr: string; count: number; level: number; isToday: boolean } | null)[][] = [];

      for (let c = 0; c < numCols; c++) {
        const col: ({ day: number; dateStr: string; count: number; level: number; isToday: boolean } | null)[] = [];
        for (let r = 0; r < 7; r++) {
          const slotIndex = c * 7 + r;
          const dayNumber = slotIndex - firstDayOfWeek + 1;

          if (dayNumber >= 1 && dayNumber <= maxDay) {
            const d = new Date(year, month, dayNumber);
            const dateStr = d.toISOString().slice(0, 10);
            const isToday = isCurrentMonth && dayNumber === today.getDate();

            let count = analytics?.dailyActivity?.[dateStr] || 0;

            // Fallback: populate active streak days if user practiced recently
            if (count === 0 && analytics?.currentStreak > 0 && viewPeriod === 'current') {
              const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays < analytics.currentStreak) {
                count = 1;
              }
            }

            eligibleDays++;
            if (count > 0) activeCount++;

            let level = 0;
            if (count >= 5) level = 4;
            else if (count >= 3) level = 3;
            else if (count >= 2) level = 2;
            else if (count >= 1) level = 1;

            col.push({
              day: dayNumber,
              dateStr,
              count,
              level,
              isToday
            });
          } else {
            col.push(null);
          }
        }
        columns.push(col);
      }

      generatedMonths.push({
        year,
        month,
        monthName,
        columns
      });
    }

    const rate = eligibleDays > 0 ? Math.round((activeCount / eligibleDays) * 100) : 0;
    const startStr = generatedMonths[0]?.monthName + ' ' + generatedMonths[0]?.year;
    const endStr = generatedMonths[generatedMonths.length - 1]?.monthName + ' ' + generatedMonths[generatedMonths.length - 1]?.year;

    return {
      monthsData: generatedMonths,
      totalActiveDays: activeCount,
      consistencyRate: rate,
      periodLabel: `${startStr} – ${endStr}`
    };
  }, [viewPeriod, analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
        <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Compiling Metrics...</span>
      </div>
    );
  }

  // Color mappings matching AptiRush design tokens
  const getCellClasses = (level: number, isToday: boolean) => {
    const todayRing = isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-container-lowest animate-pulse' : '';

    switch (level) {
      case 4:
        return `bg-primary hover:bg-primary-container text-on-primary shadow-xs ${todayRing}`;
      case 3:
        return `bg-secondary hover:bg-secondary/90 text-on-secondary shadow-xs ${todayRing}`;
      case 2:
        return `bg-secondary-fixed-dim hover:bg-secondary border border-secondary/40 ${todayRing}`;
      case 1:
        return `bg-secondary-fixed/50 hover:bg-secondary-fixed-dim border border-secondary-fixed/80 ${todayRing}`;
      default:
        return `bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 ${todayRing}`;
    }
  };

  return (
    <div className="flex flex-col w-full relative min-h-[calc(100vh-140px)]">
      <div className="max-w-[1120px] mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-xl">
        
        {/* Header */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span className="material-symbols-outlined text-base">monitoring</span>
            <span className="tracking-wide uppercase font-bold">Performance Insights</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Analytics & Streak Vault</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Daily test and duel submissions tracked automatically across rolling 12-month cycles.</p>
        </div>

        {/* Top Gamification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* Streak Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col gap-space-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/30 text-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">local_fire_department</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-tertiary-container font-label-sm text-xs font-bold flex items-center gap-1">
                <span>Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Current Login Streak</span>
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold flex items-baseline gap-1.5">
                <span>{analytics?.currentStreak || 0}</span>
                <span className="font-body-sm text-on-surface-variant font-normal">days</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Longest record: <span className="font-bold text-on-surface">{analytics?.longestStreak || 0} days</span>
            </p>
          </div>

          {/* Weakness Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col gap-space-sm transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-error-container/30 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">trending_down</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Primary Weakness</span>
              <div className="font-headline-md text-headline-md font-bold text-error truncate">
                {analytics?.weakness || 'None Detected'}
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Targeted review sets generated in Mistake Vault.</p>
          </div>

          {/* Daily Quest */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">assignment_turned_in</span>
                <span className="font-title-md text-title-md font-semibold text-on-surface">Daily Quest</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold">
                {Math.min(2, analytics?.testsCompletedToday || 0)} / 2
              </span>
            </div>
            <div className="mt-4">
              <p className="font-body-md text-body-md text-on-surface-variant mb-2">Complete 2 Practice Modules today.</p>
              <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((analytics?.testsCompletedToday || 0) / 2) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Month-by-Month Streak Heat Map Section */}
        <div className="bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-2xl shadow-sm border border-surface-variant flex flex-col gap-space-md">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-variant/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <h2 className="font-title-md text-[18px] font-bold text-on-surface flex items-center gap-2">
                  <span>Consistency & Streak Heat Map</span>
                  {viewPeriod === 'current' && analytics?.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary-container text-xs font-bold">
                      🔥 {analytics.currentStreak} Day Streak
                    </span>
                  )}
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  {periodLabel} • Automatically updates each day
                </p>
              </div>
            </div>

            {/* Previous Year Toggle */}
            <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setViewPeriod('current')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewPeriod === 'current'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Current (Past 10 Months)
              </button>
              <button
                onClick={() => setViewPeriod('previous')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewPeriod === 'previous'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Previous Year
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container-low rounded-xl border border-surface-variant/40">
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Active Days</span>
              <span className="font-headline-sm text-base font-bold text-on-surface">{totalActiveDays} Days</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                {viewPeriod === 'current' ? 'Current Streak' : 'Prior Streak'}
              </span>
              <span className="font-headline-sm text-base font-bold text-secondary flex items-center gap-1">
                <span>{viewPeriod === 'current' ? (analytics?.currentStreak || 0) : 0} Days</span>
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Consistency Rate</span>
              <span className="font-headline-sm text-base font-bold text-primary">{consistencyRate}%</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Best All-Time Record</span>
              <span className="font-headline-sm text-base font-bold text-tertiary-container flex items-center gap-1">
                <span>{analytics?.longestStreak || 0} Days</span>
                <span className="material-symbols-outlined text-[16px]">military_tech</span>
              </span>
            </div>
          </div>

          {/* Heat Map Grid: Month-by-Month Clusters (Matching Reference Image) */}
          <div className="w-full overflow-x-auto pb-3 pt-2">
            <div className="flex items-start justify-between gap-2.5 sm:gap-3.5 min-w-[640px] sm:min-w-[720px] px-1">
              {monthsData.map((m, mIdx) => (
                <div key={mIdx} className="flex flex-col items-center">
                  {/* Month columns */}
                  <div className="flex gap-[3px]">
                    {m.columns.map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-[3px]">
                        {col.map((cell, rIdx) => {
                          if (!cell) {
                            return (
                              <div key={rIdx} className="w-3.5 h-3.5 opacity-0 pointer-events-none" />
                            );
                          }

                          const formatted = new Date(m.year, m.month, cell.day).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });

                          return (
                            <div
                              key={cell.dateStr}
                              onMouseEnter={() =>
                                setHoveredCell({
                                  dateStr: cell.dateStr,
                                  count: cell.count,
                                  formattedDate: formatted
                                })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`w-3.5 h-3.5 rounded-[3px] cursor-pointer transition-all duration-150 transform hover:scale-125 hover:z-10 ${getCellClasses(
                                cell.level,
                                cell.isToday
                              )}`}
                              title={`${cell.count} tests on ${formatted}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Centered Month Label Underneath (Oct, Nov, Dec...) */}
                  <span className="text-[11px] font-semibold text-on-surface-variant mt-2.5 tracking-tight select-none">
                    {m.monthName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Tooltip & Legend */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-surface-variant/40 text-xs">
            {/* Dynamic Status Display */}
            <div className="text-on-surface-variant font-medium min-h-[20px] flex items-center gap-1.5">
              {hoveredCell ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-bold text-on-surface">
                    {hoveredCell.count === 0 ? 'No activity' : `${hoveredCell.count} practice/test${hoveredCell.count > 1 ? 's' : ''}`}
                  </span>
                  <span>on {hoveredCell.formattedDate}</span>
                </>
              ) : (
                <span className="text-outline">Hover over any day square to inspect test session volume</span>
              )}
            </div>

            {/* Legend Scale */}
            <div className="flex items-center gap-2 text-outline-variant font-medium select-none self-end sm:self-auto">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-surface-container border border-outline-variant/30" title="0 tests" />
                <div className="w-3 h-3 rounded-[2px] bg-secondary-fixed/50 border border-secondary-fixed/80" title="1 test" />
                <div className="w-3 h-3 rounded-[2px] bg-secondary-fixed-dim" title="2 tests" />
                <div className="w-3 h-3 rounded-[2px] bg-secondary" title="3-4 tests" />
                <div className="w-3 h-3 rounded-[2px] bg-primary" title="5+ tests" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Mistake Vault */}
        <div className="flex flex-col gap-space-md mt-space-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Mistake Vault</h2>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">Recorded incorrect attempts from practice sessions and battle arenas</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold">
              {mistakes.length} Recorded
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-variant overflow-hidden">
            {mistakes.length === 0 ? (
              <div className="p-space-xl text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-4">task_alt</span>
                <p className="font-body-lg text-body-lg text-on-surface font-semibold">Your vault is spotless.</p>
                <p className="font-body-sm text-on-surface-variant mt-1">You haven't made any recorded mistakes in your recent attempts.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-container-low">
                {mistakes.map((mistake, idx) => (
                  <div key={mistake.id} className="p-space-lg hover:bg-surface-container-lowest/50 transition-colors">
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase font-bold">
                        {mistake.type} FORMAT
                      </span>
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
                                ? 'border-secondary bg-secondary-container/20 text-secondary' 
                                : key === mistake.userAnswer
                                ? 'border-error bg-error-container/20 text-error'
                                : 'border-outline-variant/30 text-on-surface-variant'
                            }`}
                          >
                            <span className="font-bold mr-2">{key}.</span>
                            <span>{String(val)}</span>
                            {key === mistake.correctAnswer && <span className="float-right material-symbols-outlined text-sm text-secondary font-bold">check_circle</span>}
                            {key === mistake.userAnswer && <span className="float-right material-symbols-outlined text-sm text-error font-bold">cancel</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {mistake.type === 'TITA' && (
                      <div className="flex flex-col sm:flex-row gap-space-md mb-space-md">
                        <div className="flex-1 p-3 rounded-xl border border-error bg-error-container/20 text-error flex items-center justify-between">
                          <div>
                            <span className="font-label-sm block uppercase tracking-wider mb-1 font-bold">Your Answer</span>
                            <span className="font-bold">{mistake.userAnswer}</span>
                          </div>
                          <span className="material-symbols-outlined">cancel</span>
                        </div>
                        <div className="flex-1 p-3 rounded-xl border border-secondary bg-secondary-container/20 text-secondary flex items-center justify-between">
                          <div>
                            <span className="font-label-sm block uppercase tracking-wider mb-1 font-bold">Correct Answer</span>
                            <span className="font-bold">{mistake.correctAnswer}</span>
                          </div>
                          <span className="material-symbols-outlined font-bold">check_circle</span>
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

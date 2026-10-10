'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    async function fetchLeaderboard() {
      try {
        const res = await api.get('/student/leaderboard');
        setLeaderboard(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
        <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Syncing Global Data...</span>
      </div>
    );
  }

  const getTier = (elo: number) => {
    if (elo >= 2400) return 'Apex Master';
    if (elo >= 2100) return 'Master I';
    if (elo >= 2000) return 'Diamond I';
    if (elo >= 1800) return 'Diamond II';
    return 'Bronze Crest';
  };

  const currentUserData = leaderboard.find(l => l.id === currentUser?.id);
  const currentUserRank = leaderboard.findIndex(l => l.id === currentUser?.id) + 1;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="flex flex-col w-full relative min-h-[calc(100vh-140px)]">
      <div className="max-w-[1120px] mx-auto w-full px-gutter py-space-lg flex flex-col gap-space-xl">
        
        {/* Top Filter & Perspective Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span className="material-symbols-outlined text-base">military_tech</span>
              <span className="tracking-wide">SEASON 14 • ZEN DIVISION</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Global Leaderboard</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Top analytical minds, collegiate syndicates, and cognitive duelists worldwide.</p>
          </div>

          {/* Segmented Selectors */}
          <div className="flex flex-wrap items-center gap-space-xs p-1.5 bg-surface-container-low rounded-xl">
            <button className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm transition-all">This Season</button>
            <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all">Monthly</button>
            <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all">All-Time</button>
            <div className="w-px h-4 bg-outline-variant/40 mx-1"></div>
            <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all font-semibold">Global Top 100</button>
            <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all">Universities</button>
          </div>
        </div>

        {/* Podium Section */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-end pt-space-sm">
            
            {/* Rank 2 */}
            {top3[1] && (
              <div className="order-2 md:order-1 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md hover:shadow-md transition-all border border-surface-variant">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-headline-sm text-headline-sm">2</div>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">workspace_premium</span> Silver Tier
                  </span>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">{top3[1].name.substring(0,2).toUpperCase()}</div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{top3[1].name}</h3>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{top3[1].affiliation}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Rating</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-semibold">{top3[1].elo}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Win Rate</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-semibold">{top3[1].winRate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {top3[0] && (
              <div className="order-1 md:order-2 bg-surface-container-lowest p-space-xl rounded-2xl shadow-md flex flex-col gap-space-md -mt-4 relative overflow-hidden border border-surface-variant">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-tertiary-fixed/40 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-headline-sm text-headline-sm font-bold shadow-sm">1</div>
                  <span className="px-space-md py-1 rounded-full bg-tertiary-fixed/50 text-tertiary font-label-md text-label-md font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-tertiary-container">emoji_events</span> Apex Master
                  </span>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary font-bold text-xl">{top3[0].name.substring(0,2).toUpperCase()}</div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-xs">star</span>
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline-md text-headline-md text-on-surface truncate">{top3[0].name}</h3>
                      <span className="material-symbols-outlined text-sm text-primary">verified</span>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface-variant truncate">{top3[0].affiliation}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Global Elo</span>
                    <span className="font-display text-headline-lg text-primary font-bold">{top3[0].elo}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Accuracy</span>
                    <span className="font-display text-headline-lg text-secondary font-bold">{top3[0].accuracy}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {top3[2] && (
              <div className="order-3 md:order-3 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md hover:shadow-md transition-all border border-surface-variant">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-headline-sm text-headline-sm">3</div>
                  <span className="px-space-sm py-0.5 rounded-full bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">military_tech</span> Bronze Crest
                  </span>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold">{top3[2].name.substring(0,2).toUpperCase()}</div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-container-highest text-on-surface rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{top3[2].name}</h3>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{top3[2].affiliation}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Rating</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-semibold">{top3[2].elo}</span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Win Rate</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-semibold">{top3[2].winRate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          
          {/* Left (8 Cols): Minimalist Ranks Table */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="font-title-md text-title-md text-on-surface font-semibold">Division Contenders</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">4 - 100 of 100</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Live Updates
              </span>
            </div>
            
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col border border-surface-variant">
              <div className="grid grid-cols-12 px-space-lg py-space-sm bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm select-none">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Player & Affiliation</div>
                <div className="col-span-2 text-center">Tier</div>
                <div className="col-span-2 text-right">Avg Speed</div>
                <div className="col-span-2 text-right">MMR</div>
              </div>
              
              <div className="divide-y divide-surface-container-low flex flex-col">
                {rest.map((student, idx) => (
                  <div key={student.id} className="grid grid-cols-12 px-space-lg py-3.5 items-center hover:bg-surface-container-low/40 transition-colors">
                    <div className="col-span-1 text-center font-label-md text-label-md font-semibold text-on-surface">{idx + 4}</div>
                    <div className="col-span-5 flex items-center gap-space-sm min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-semibold text-xs text-primary flex-shrink-0">
                        {student.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-label-lg text-on-surface truncate">{student.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{student.affiliation}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">{getTier(student.elo)}</span>
                    </div>
                    <div className="col-span-2 text-right font-label-md text-label-md text-on-surface-variant">{student.avgSpeed}</div>
                    <div className="col-span-2 text-right font-title-md text-title-md text-primary font-semibold">{student.elo}</div>
                  </div>
                ))}
              </div>

              {currentUserData && (
                <div className="sticky bottom-0 bg-primary-fixed/40 backdrop-blur-md px-space-lg py-3.5 grid grid-cols-12 items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-primary/20">
                  <div className="col-span-1 text-center font-label-md text-label-md font-bold text-primary">#{currentUserRank}</div>
                  <div className="col-span-5 flex items-center gap-space-sm min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {currentUserData.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold truncate flex items-center gap-1">
                        {currentUserData.name} <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-on-primary font-medium">YOU</span>
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{currentUserData.affiliation} • {currentUserData.winRate} Win</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm">{getTier(currentUserData.elo)}</span>
                  </div>
                  <div className="col-span-2 text-right font-label-md text-label-md text-on-surface">{currentUserData.avgSpeed} avg</div>
                  <div className="col-span-2 text-right font-title-md text-title-md text-primary font-bold">{currentUserData.elo}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right (4 Cols): Skill Mastery Profile Card */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-variant flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Skill Mastery</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Cognitive Aptitude Matrix</span>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors" title="Matrix breakdown info">
                  <span className="material-symbols-outlined text-base">info</span>
                </button>
              </div>

              {/* Mastery Breakdown Bars */}
              <div className="flex flex-col gap-space-sm pt-space-xs">
                {/* Quantitative */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-primary"></span> Quantitative Aptitude
                    </span>
                    <span className="font-semibold text-primary">92<span className="text-on-surface-variant font-normal">/100 (Master)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: '92%'}}></div>
                  </div>
                </div>
                
                {/* Logical Reasoning */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span> Logical Reasoning
                    </span>
                    <span className="font-semibold text-secondary">89<span className="text-on-surface-variant font-normal">/100 (Master)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{width: '89%'}}></div>
                  </div>
                </div>

                {/* Verbal Blitz */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-surface-tint"></span> Verbal Blitz
                    </span>
                    <span className="font-semibold text-on-surface">84<span className="text-on-surface-variant font-normal">/100 (Diamond)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                    <div className="h-full bg-surface-tint rounded-full transition-all duration-500" style={{width: '84%'}}></div>
                  </div>
                </div>

                {/* Data Interpretation */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-tertiary-container"></span> Data Interpretation
                    </span>
                    <span className="font-semibold text-on-surface">81<span className="text-on-surface-variant font-normal">/100 (Diamond)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                    <div className="h-full bg-tertiary-container rounded-full transition-all duration-500" style={{width: '81%'}}></div>
                  </div>
                </div>
              </div>

              {/* Milestone Callout */}
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs mt-1 border border-surface-variant">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Season Goal</span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">28 MMR to Apex Master</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{width: '82%'}}></div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Win 2 consecutive cognitive duels to surpass current tier threshold.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

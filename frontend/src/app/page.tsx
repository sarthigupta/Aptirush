'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'battles' | 'pipeline' | 'faculty' | 'analytics'>('battles');
  const [activeTier, setActiveTier] = useState<number>(3);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Simulated battle score animation
  const [p1Score, setP1Score] = useState(30);
  const [p2Score, setP2Score] = useState(20);
  const [battleTimer, setBattleTimer] = useState(14);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);

    // Subtle battle simulation ticker
    const interval = setInterval(() => {
      setBattleTimer((prev) => (prev > 1 ? prev - 1 : 15));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const tiers = [
    { name: 'Initiate', minElo: 1000, color: 'text-outline', badgeBg: 'bg-surface-container', icon: 'shield' },
    { name: 'Bronze Crest', minElo: 1500, color: 'text-tertiary-container', badgeBg: 'bg-tertiary-fixed/40', icon: 'military_tech' },
    { name: 'Diamond II', minElo: 1800, color: 'text-primary', badgeBg: 'bg-primary-fixed/40', icon: 'diamond' },
    { name: 'Diamond I', minElo: 2000, color: 'text-primary-container', badgeBg: 'bg-primary-fixed', icon: 'workspace_premium' },
    { name: 'Master I', minElo: 2100, color: 'text-secondary', badgeBg: 'bg-secondary-fixed/50', icon: 'stars' },
    { name: 'Apex Master', minElo: 2400, color: 'text-secondary-fixed-dim', badgeBg: 'bg-secondary-fixed', icon: 'crown' },
  ];

  const faqs = [
    {
      q: 'How do 1v1 Battle Arenas work in AptiRush?',
      a: 'When you queue for a match, our matchmaking engine pairs you with an opponent within ±50 Elo MMR. Both players receive identical aptitude questions in real time with WebSocket sync, streaming live opponent scores as you answer.',
    },
    {
      q: 'What is the AI Automated Question Pipeline?',
      a: 'Faculty and administrators can upload syllabi or exam PDFs (like CRPC, Quantitative Aptitude, or Logical Reasoning). Our pipeline parses the document with AWS Textract and AI extraction, structuring questions, options, and solutions directly into your live question bank.',
    },
    {
      q: 'Can institutions host synchronized cohort exams?',
      a: 'Yes. Faculty can create custom test papers from the shared question bank, set exact durations, and initiate a synchronized lobby where all registered students begin simultaneously with live anti-cheat timers and automated grading.',
    },
    {
      q: 'What is the Mistake Vault?',
      a: 'Every question you answer incorrectly during battles, practice sets, or exams is automatically saved to your private Mistake Vault with detailed analysis, enabling targeted spaced repetition.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-primary/10 via-surface-container-high/40 to-transparent rounded-full blur-[120px] opacity-70" />
        <div className="absolute top-[35%] -left-[150px] w-[500px] h-[500px] bg-secondary-fixed-dim/15 rounded-full blur-[100px]" />
        <div className="absolute top-[65%] -right-[150px] w-[600px] h-[600px] bg-primary-fixed-dim/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-variant/40 transition-all">
        <div className="max-w-[1200px] mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">swords</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[20px] font-bold text-on-surface tracking-tight flex items-center gap-1.5">
                Apti<span className="text-primary">Rush</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary border border-secondary/20">
                  Arena
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
              Features
            </a>
            <a href="#arena" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
              1v1 Duels
            </a>
            <a href="#tiers" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
              Ranks & Elo
            </a>
            <a href="#pipeline" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
              AI Question Bank
            </a>
            <a href="#faq" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow-sm hover:shadow-primary/20 hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <span>Enter the Arena</span>
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-container-lowest border-b border-surface-variant px-6 py-4 flex flex-col gap-3 shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-semibold text-on-surface"
            >
              Features
            </a>
            <a
              href="#arena"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-semibold text-on-surface"
            >
              1v1 Duels
            </a>
            <a
              href="#tiers"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-semibold text-on-surface"
            >
              Ranks & Elo
            </a>
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-semibold text-on-surface"
            >
              AI Pipeline
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-semibold text-on-surface"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-surface-variant flex flex-col gap-2">
              <Link
                href="/login"
                className="py-2.5 text-center text-sm font-semibold text-on-surface bg-surface-container rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="py-2.5 text-center text-sm font-semibold text-on-primary bg-primary rounded-lg shadow-sm"
              >
                Enter the Arena
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-surface-variant/80 text-primary font-semibold text-xs tracking-wide">
                <span className="flex h-2 w-2 rounded-full bg-secondary-fixed-dim animate-pulse" />
                <span>Next-Gen Competitive Cognitive Training</span>
                <span className="text-outline-variant">|</span>
                <span className="text-secondary font-bold">Season 2 Live</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-[42px] sm:text-[54px] lg:text-[62px] leading-[1.1] font-extrabold text-on-surface tracking-tight">
                Master Aptitude in{' '}
                <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
                  Real-Time 1v1 Duels
                </span>
              </h1>

              {/* Description */}
              <p className="font-body-lg text-[17px] sm:text-[19px] text-on-surface-variant max-w-xl leading-relaxed">
                Elevate your analytical, quantitative, and logical speed through live multiplayer matchups, AI-extracted syllabus banks, and deep performance analytics.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl bg-primary text-on-primary font-headline-sm text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary-container hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-center"
                >
                  <span className="material-symbols-outlined text-[22px]">swords</span>
                  <span>Queue for 1v1 Match</span>
                </Link>

                <Link
                  href="/login"
                  className="px-7 py-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-semibold text-base hover:bg-surface-container hover:border-outline transition-all flex items-center justify-center gap-2 text-center"
                >
                  <span>Student & Faculty Portal</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-surface-variant/70 w-full max-w-lg">
                <div>
                  <div className="font-display text-[26px] font-bold text-primary">±50 MMR</div>
                  <div className="text-xs text-on-surface-variant font-medium">Fair Matchmaking</div>
                </div>
                <div>
                  <div className="font-display text-[26px] font-bold text-secondary">100% Sync</div>
                  <div className="text-xs text-on-surface-variant font-medium">WebSocket Latency</div>
                </div>
                <div>
                  <div className="font-display text-[26px] font-bold text-tertiary-container">6 Tiers</div>
                  <div className="text-xs text-on-surface-variant font-medium">Initiate to Apex</div>
                </div>
              </div>
            </div>

            {/* Right Live Simulation Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[460px] rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-surface-variant/80 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-error" />
                    <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" />
                    <span className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
                    <span className="ml-2 font-label-md text-xs font-bold uppercase tracking-wider text-primary">
                      Live Battle Chamber #782
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-error-container/60 text-error text-[11px] font-bold uppercase animate-pulse">
                    Live
                  </span>
                </div>

                {/* Matchup Header */}
                <div className="py-5 flex items-center justify-between">
                  {/* Player 1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-bold text-primary">
                      AK
                    </div>
                    <div>
                      <div className="font-title-md text-sm font-bold text-on-surface">Alex K.</div>
                      <div className="text-xs text-primary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">military_tech</span>
                        <span>1840 ELO</span>
                      </div>
                    </div>
                  </div>

                  {/* VS Circle with Timer */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-black text-xs text-primary shadow-inner">
                      VS
                    </div>
                    <span className="text-[11px] font-mono font-bold text-on-surface-variant mt-1">
                      {battleTimer}s left
                    </span>
                  </div>

                  {/* Player 2 */}
                  <div className="flex items-center gap-3 text-right flex-row-reverse">
                    <div className="w-11 h-11 rounded-full bg-secondary-fixed/40 border-2 border-secondary flex items-center justify-center font-bold text-secondary">
                      RV
                    </div>
                    <div>
                      <div className="font-title-md text-sm font-bold text-on-surface">Rhea V.</div>
                      <div className="text-xs text-secondary font-semibold flex items-center gap-1 justify-end">
                        <span className="material-symbols-outlined text-[13px]">diamond</span>
                        <span>1865 ELO</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Progress Bars */}
                <div className="space-y-2 pb-5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-primary">{p1Score} PTS</span>
                    <span className="text-outline text-[11px]">Race to 50</span>
                    <span className="text-secondary">{p2Score} PTS</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden flex">
                    <div
                      className="bg-primary h-full transition-all duration-500 rounded-l-full"
                      style={{ width: `${(p1Score / 50) * 50}%` }}
                    />
                    <div className="flex-1 bg-surface-container" />
                    <div
                      className="bg-secondary h-full transition-all duration-500 rounded-r-full"
                      style={{ width: `${(p2Score / 50) * 50}%` }}
                    />
                  </div>
                </div>

                {/* Mock Active Question */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/70 text-left space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="font-bold uppercase tracking-wider text-primary">Quantitative Reasoning</span>
                    <span>Q 3 of 5</span>
                  </div>
                  <p className="font-body-sm text-[13px] font-semibold text-on-surface">
                    A train 240m long passes a pole in 24 seconds. How long will it take to pass a 650m platform?
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-surface border border-outline-variant/60 text-xs font-medium text-on-surface hover:border-primary cursor-pointer transition-colors">
                      A. 65 seconds
                    </div>
                    <div className="p-2 rounded-lg bg-primary-fixed/50 border-2 border-primary text-xs font-bold text-on-primary-fixed flex items-center justify-between">
                      <span>B. 89 seconds</span>
                      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-outline-variant/60 text-xs font-medium text-on-surface">
                      C. 72 seconds
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-outline-variant/60 text-xs font-medium text-on-surface">
                      D. 96 seconds
                    </div>
                  </div>
                </div>

                {/* Bottom Status pill */}
                <div className="mt-4 pt-3 border-t border-surface-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1 text-secondary font-semibold">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Predicted MMR: +24 Elo</span>
                  </span>
                  <span className="text-outline font-medium">Real-time WebSocket</span>
                </div>
              </div>

              {/* Decorative Floating Badges */}
              <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-3.5 rounded-xl shadow-xl border border-surface-variant hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
                </div>
                <div className="text-left">
                  <div className="font-label-md text-xs font-bold text-on-surface">5x Win Streak!</div>
                  <div className="text-[11px] text-secondary font-semibold">+15 MMR Streak Bonus</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-24 bg-surface-container-low/50 relative z-10 border-y border-surface-variant/40">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary font-bold text-xs uppercase tracking-wider mb-4">
            Engineered For Excellence
          </div>
          <h2 className="font-display text-[32px] sm:text-[42px] font-bold text-on-surface tracking-tight mb-4">
            The Complete Cognitive Arena Platform
          </h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-16">
            From casual peer duels to faculty-managed standardized exams, AptiRush replaces outdated static quizzes with real-time competitive rigor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/70 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all">
                <span className="material-symbols-outlined text-[26px]">swords</span>
              </div>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface mb-2">
                1v1 Real-Time Battle Arena
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Experience instant matchmaking within ±50 Elo MMR or create a 6-digit private chamber code to challenge campus friends to head-to-head duels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/70 shadow-sm hover:shadow-md hover:border-secondary/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                <span className="material-symbols-outlined text-[26px]">smart_toy</span>
              </div>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface mb-2">
                AI PDF Extraction Pipeline
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Faculty can upload dense syllabi PDFs. AWS Textract and Bedrock parse questions, formula tokens, choices, and solutions directly into the database.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/70 shadow-sm hover:shadow-md hover:border-tertiary-container/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/60 text-tertiary-container flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-tertiary-container group-hover:text-on-tertiary transition-all">
                <span className="material-symbols-outlined text-[26px]">groups</span>
              </div>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface mb-2">
                Simultaneous Cohort Exams
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Lock in timed institutional test lobbies with a synchronized global countdown, server-side auto-submission, and instant rank ladders.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/70 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed/50 text-primary-container flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-container group-hover:text-on-primary transition-all">
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface mb-2">
                Personal Mistake Vault
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Never repeat an error. Every missed question is categorized by topic in your vault for targeted spaced review before campus placements.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/70 shadow-sm hover:shadow-md hover:border-secondary/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                <span className="material-symbols-outlined text-[26px]">analytics</span>
              </div>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface mb-2">
                Speed & Accuracy Analytics
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Track completion time per question, win-rate by aptitude domain (Quant, Logical, Verbal), and your complete Elo history trajectory.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/70 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all">
                <span className="material-symbols-outlined text-[26px]">shield</span>
              </div>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface mb-2">
                Role-Based Faculty Controls
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Dedicated interfaces for Students, Faculty, and Admin. Faculty can curate custom tests, publish modules, and review student performance batch-wise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rank Ladder / Elo Tiers Section */}
      <section id="tiers" className="py-24 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full bg-surface-container-high text-primary font-bold text-xs uppercase tracking-wider">
              Competitive Progression
            </span>
            <h2 className="font-display text-[32px] sm:text-[42px] font-bold text-on-surface tracking-tight mt-3 mb-4">
              Elo Rating & Tier Ladder
            </h2>
            <p className="font-body-md text-on-surface-variant">
              Every duel adjusts your rating with Chess-style Elo math. Earn win-streak multipliers and claim your crest on the global leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {tiers.map((tier, index) => {
              const isSelected = activeTier === index;
              return (
                <div
                  key={tier.name}
                  onClick={() => setActiveTier(index)}
                  className={`p-5 rounded-2xl text-center cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-surface-container-lowest border-primary shadow-lg scale-105'
                      : 'bg-surface-container-low border-surface-variant/60 hover:border-outline hover:bg-surface-container-lowest'
                  }`}
                >
                  <div
                    className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center ${tier.badgeBg} ${tier.color}`}
                  >
                    <span className="material-symbols-outlined text-[28px]">{tier.icon}</span>
                  </div>
                  <h4 className="font-title-md text-sm font-bold text-on-surface mb-1">{tier.name}</h4>
                  <div className="text-xs font-semibold text-primary">{tier.minElo}+ Elo</div>
                  <div className="text-[11px] text-on-surface-variant mt-2 font-medium">
                    Tier {index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Tier Spotlight Card */}
          <div className="mt-8 p-8 rounded-2xl bg-surface-container-lowest border border-surface-variant/80 shadow-md max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${tiers[activeTier].badgeBg} ${tiers[activeTier].color}`}
              >
                <span className="material-symbols-outlined text-[36px]">{tiers[activeTier].icon}</span>
              </div>
              <div className="text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">Tier {activeTier + 1} Status</span>
                <h3 className="font-display text-[24px] font-bold text-on-surface">
                  {tiers[activeTier].name}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Threshold: <span className="font-bold text-primary">{tiers[activeTier].minElo} MMR</span>. Matchmaking pool comprises the top{' '}
                  {activeTier >= 4 ? '5%' : activeTier >= 2 ? '25%' : '75%'} of contenders.
                </p>
              </div>
            </div>

            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container shadow-sm transition-all whitespace-nowrap"
            >
              Climb to {tiers[activeTier].name}
            </Link>
          </div>
        </div>
      </section>

      {/* Dual Persona Showcase: Students & Faculty */}
      <section id="pipeline" className="py-24 bg-surface-container-low/40 relative z-10 border-t border-surface-variant/40">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Student Persona Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-surface-container-lowest border border-surface-variant/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6">
                  For Students & Aspirants
                </div>
                <h3 className="font-display text-[28px] font-bold text-on-surface mb-3">
                  Turn Aptitude Prep into a Daily Game
                </h3>
                <p className="font-body-md text-on-surface-variant mb-6 leading-relaxed">
                  Prepare for campus placements, CAT, GATE, and civil exams without boring question sheets. Compete against batchmates, track your speed metrics, and redeem streak bonuses.
                </p>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">✓</span>
                    Instant 1v1 matchmaking with live progress bars
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">✓</span>
                    Automated mistake vault for quick retention review
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">✓</span>
                    Domain ratings across Quant, Logical, & Verbal
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container text-center transition-all shadow-sm"
              >
                Create Student Account
              </Link>
            </div>

            {/* Faculty Persona Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-surface-container-lowest border border-surface-variant/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/40 text-secondary font-bold text-xs uppercase tracking-wider mb-6">
                  For Colleges & Faculty
                </div>
                <h3 className="font-display text-[28px] font-bold text-on-surface mb-3">
                  Effortless Question Ingestion & Exam Lobbies
                </h3>
                <p className="font-body-md text-on-surface-variant mb-6 leading-relaxed">
                  Stop manually copying questions. Upload your exam PDF to AWS Textract, auto-generate structured test sets, and schedule synchronized batch examinations with anti-cheat protection.
                </p>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">✓</span>
                    One-click PDF syllabus ingestion via AWS AI Pipeline
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">✓</span>
                    Synchronized live tests with countdown starting gates
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">✓</span>
                    Institutional batch leaderboards & weakness heatmaps
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="w-full py-3.5 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-highest text-center transition-all"
              >
                Access Faculty Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 relative z-10">
        <div className="max-w-[840px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="px-3.5 py-1 rounded-full bg-surface-container-high text-primary font-bold text-xs uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="font-display text-[32px] sm:text-[40px] font-bold text-on-surface tracking-tight mt-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-surface-container-lowest border border-surface-variant/80 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-title-md text-base font-bold text-on-surface hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-primary text-[24px] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-on-surface-variant leading-relaxed border-t border-surface-variant/40 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-tr from-primary to-primary-container p-10 sm:p-16 text-center text-on-primary overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-on-primary-container/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="px-3.5 py-1.5 rounded-full bg-on-primary/10 border border-on-primary/20 font-bold text-xs uppercase tracking-wider text-secondary-fixed">
                ⚡ Ready To Test Your Mental Speed?
              </span>
              <h2 className="font-display text-[34px] sm:text-[46px] font-extrabold tracking-tight leading-tight">
                Join Hundreds of Contenders in AptiRush Today
              </h2>
              <p className="text-on-primary-container text-base sm:text-lg">
                Create your account, climb the Elo tier ladder, and sharpen your cognitive problem-solving speed for competitive placement tests.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl bg-surface-container-lowest text-primary font-bold text-base shadow-lg hover:bg-surface transition-all active:scale-95 w-full sm:w-auto"
                >
                  Start Battling Free
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-xl bg-on-primary/15 border border-on-primary/30 text-on-primary font-bold text-base hover:bg-on-primary/25 transition-all w-full sm:w-auto"
                >
                  Sign In To Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-surface-variant/80 py-12 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-on-surface-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">swords</span>
            </div>
            <span className="font-headline-sm text-base font-bold text-on-surface">AptiRush</span>
            <span className="text-outline-variant">|</span>
            <span className="text-xs">Mindful Competitive Aptitude Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/login" className="hover:text-primary transition-colors">
              Student Login
            </Link>
            <Link href="/login" className="hover:text-primary transition-colors">
              Faculty Portal
            </Link>
            <Link href="/register" className="hover:text-primary transition-colors">
              Register
            </Link>
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
          </div>

          <div className="text-xs text-outline">
            &copy; {new Date().getFullYear()} AptiRush. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

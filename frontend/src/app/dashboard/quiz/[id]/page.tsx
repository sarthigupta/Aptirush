'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  
  const [module, setModule] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titaInput, setTitaInput] = useState('');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await api.get(`/student/modules/${id}`);
        setModule(res.data);
      } catch (err) {
        console.error('Failed to load quiz');
      } finally {
        setStartTime(Date.now());
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (type !== 'custom' || !user) return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join_test_room', { customTestId: id, userId: user.id, name: user.name });

    newSocket.on('initial_leaderboard', (data) => {
      setLeaderboard(data.leaderboard);
    });

    newSocket.on('leaderboard_update', (data) => {
      setLeaderboard(prev => {
        const existing = prev.find(p => p.userId === data.userId);
        if (existing) {
          return prev.map(p => p.userId === data.userId ? { ...p, score: data.score, isFinished: data.isFinished } : p).sort((a,b) => b.score - a.score);
        } else {
          return [...prev, data].sort((a,b) => b.score - a.score);
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [type, id, user]);

  const emitProgress = (newAnswers: Record<string, string>, finished: boolean) => {
    if (type !== 'custom' || !socket || !user || !module) return;
    
    let currentScore = 0;
    module.questions.forEach((q: any) => {
      if (newAnswers[q.id] && newAnswers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
        currentScore++;
      }
    });

    socket.emit('test_progress', {
      customTestId: id,
      userId: user.id,
      name: user.name,
      score: currentScore,
      isFinished: finished
    });
    
    setLeaderboard(prev => {
      const data = { userId: user.id, name: user.name, score: currentScore, isFinished: finished };
      const existing = prev.find(p => p.userId === user.id);
      if (existing) {
        return prev.map(p => p.userId === user.id ? data : p).sort((a,b) => b.score - a.score);
      } else {
        return [...prev, data].sort((a,b) => b.score - a.score);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3"></div>
        <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Loading sequence...</span>
      </div>
    );
  }
  if (!module) return <div className="p-8 text-center text-error font-body-md">Simulation not found</div>;

  const questions = module.questions || [];
  
  if (questions.length === 0) {
    return <div className="p-8 text-center text-on-surface-variant font-body-md">No questions available for this module yet.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const hasAnsweredCurrent = !!answers[currentQuestion.id];

  const handleSelectOption = (optionKey: string) => {
    if (hasAnsweredCurrent) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(newAnswers);
    emitProgress(newAnswers, false);
  };

  const submitTitaAnswer = () => {
    if (hasAnsweredCurrent || !titaInput.trim()) return;
    const newAnswers = { ...answers, [currentQuestion.id]: titaInput.trim() };
    setAnswers(newAnswers);
    emitProgress(newAnswers, false);
  };

  const handleFinishQuiz = async () => {
    let score = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] && answers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
        score++;
      }
    });

    const durationMs = Date.now() - startTime;

    try {
      await api.post('/student/attempts', {
        ...(type === 'custom' ? { customTestId: id } : { moduleId: id }),
        score,
        total: questions.length,
        durationMs
      });
      emitProgress(answers, true);
    } catch (err) {
      console.error('Failed to save score', err);
    }
    
    setIsFinished(true);
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(curr => curr + 1);
      setTitaInput('');
    } else {
      handleFinishQuiz();
    }
  };

  const handlePrev = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(curr => curr - 1);
      setTitaInput('');
    }
  };

  if (isFinished) {
    let score = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] && answers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
        score++;
      }
    });

    return (
      <div className="flex flex-col w-full relative min-h-[calc(100vh-140px)]">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-44 -right-24 w-80 h-80 bg-primary-fixed/25 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-[1120px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl w-full">
          <section className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-secondary-container/40 text-on-secondary-container font-label-md text-label-md mb-space-sm shadow-sm">
              <span className="material-symbols-outlined text-base" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              <span>Simulation Complete</span>
            </div>
            <h1 className="font-display text-display text-on-surface tracking-tight mb-space-xs">Debrief</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-space-md">
              Tactical evaluation concluded for {module.title}.
            </p>
          </section>

          <section className="w-full">
            <div className="relative bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-space-lg">
                <div className="md:col-span-12 flex items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-low/80">
                  <div className="flex items-center gap-space-md">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary text-on-secondary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs">check</span>
                      </div>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-title-md text-title-md font-semibold text-on-surface">{user?.name || 'You'}</span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Final Accumulation</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-display text-primary tracking-tight leading-none">{score}</span>
                    <span className="font-headline-md text-on-surface-variant"> / {questions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {type === 'custom' && (
            <section className="flex flex-col gap-space-md mt-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block">Live Standings</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Combat Leaderboard</h2>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                <div className="space-y-2">
                  {leaderboard.length === 0 ? (
                    <p className="font-body-sm text-on-surface-variant text-center py-4">No other combatants yet.</p>
                  ) : leaderboard.map((l, idx) => (
                    <div key={l.userId} className={`flex items-center justify-between p-3 rounded-lg ${l.userId === user?.id ? 'bg-primary-container/20 border border-primary/20' : 'bg-surface-container-low/50 hover:bg-surface-container-low transition-colors'}`}>
                      <div className="flex items-center space-x-3">
                        <span className={`font-label-lg font-bold w-6 text-center ${idx === 0 ? 'text-tertiary-container' : idx === 1 ? 'text-outline' : idx === 2 ? 'text-secondary-fixed-dim' : 'text-outline-variant'}`}>
                          #{idx + 1}
                        </span>
                        <div className="truncate max-w-[150px]">
                          <span className="font-body-md font-semibold text-on-surface truncate block">{l.name}</span>
                          {l.isFinished && <span className="font-label-sm text-[10px] uppercase font-bold text-secondary">Finished</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-title-md font-bold text-primary">{l.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="mt-space-md pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
            <button onClick={() => router.push('/dashboard/tests')} className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors order-3 sm:order-1 flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-base">west</span>
              <span>Return to Practice Modules</span>
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-space-md w-full sm:w-auto order-1 sm:order-2">
              <button onClick={() => router.push('/dashboard/battle')} className="w-full sm:w-auto px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-space-xs">
                <span>Play Next Match</span>
                <span className="material-symbols-outlined text-base">play_arrow</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full relative min-h-[calc(100vh-140px)]">
      <div className="absolute top-10 right-0 w-[400px] h-[400px] bg-secondary-fixed/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-[1120px] mx-auto px-gutter py-space-lg flex gap-space-lg w-full">
        
        <div className="flex-1 flex flex-col min-w-0">
          <button 
            onClick={() => router.push('/dashboard/tests')}
            className="flex items-center w-fit font-label-md text-label-md text-on-surface-variant hover:text-on-surface mb-space-md transition-colors"
          >
            <span className="material-symbols-outlined text-base mr-1">west</span> Return
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
                <span className="material-symbols-outlined text-base">auto_stories</span>
                <span className="tracking-wide uppercase">{currentQuestion.type} FORMAT</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{module.title}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant overflow-hidden">
            <div className="p-space-xl border-b border-surface-variant bg-surface">
              <p className="font-title-md text-[18px] text-on-surface font-medium leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>
            
            <div className="p-space-xl bg-surface-container-lowest relative">
              {currentQuestion.type === 'MCQ' ? (
                <div className="space-y-space-md">
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isSelected = answers[currentQuestion.id] === key;
                    const isCorrect = key === currentQuestion.correctAnswer;
                    
                    let buttonStyle = "border-outline-variant/40 bg-surface text-on-surface hover:border-outline-variant";
                    let iconClass = "text-outline-variant";
                    let iconName = "radio_button_unchecked";
                    
                    if (hasAnsweredCurrent) {
                      if (isCorrect) {
                        buttonStyle = "border-secondary bg-secondary-container/20 text-secondary-container shadow-[0_0_10px_rgba(0,108,73,0.1)]";
                        iconClass = "text-secondary";
                        iconName = "check_circle";
                      } else if (isSelected && !isCorrect) {
                        buttonStyle = "border-error bg-error-container/20 text-error shadow-[0_0_10px_rgba(186,26,26,0.05)]";
                        iconClass = "text-error";
                        iconName = "cancel";
                      } else {
                        buttonStyle = "border-outline-variant/30 bg-surface opacity-60 cursor-not-allowed text-outline";
                      }
                    } else if (isSelected) {
                       buttonStyle = "border-primary bg-primary-container/10 text-primary shadow-sm";
                       iconClass = "text-primary";
                       iconName = "radio_button_checked";
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectOption(key)}
                        disabled={hasAnsweredCurrent}
                        className={`w-full flex items-center p-space-md rounded-xl border-2 transition-all text-left ${buttonStyle}`}
                      >
                        <div className="mr-space-md shrink-0 flex items-center justify-center">
                          <span className={`material-symbols-outlined ${iconClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {iconName}
                          </span>
                        </div>
                        <span className="font-label-lg font-bold w-8 shrink-0">{key}.</span>
                        <span className="flex-1 font-body-lg">
                          {String(value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                   <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-space-sm">Input Answer</p>
                   <div className="flex flex-col sm:flex-row gap-space-sm">
                     <input 
                       type="text" 
                       value={hasAnsweredCurrent ? answers[currentQuestion.id] : titaInput}
                       onChange={(e) => setTitaInput(e.target.value)}
                       disabled={hasAnsweredCurrent}
                       placeholder="Awaiting input..."
                       className={`flex-1 border-2 rounded-xl p-space-md outline-none font-body-lg transition-all ${
                          hasAnsweredCurrent 
                            ? answers[currentQuestion.id]?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                              ? 'border-secondary bg-secondary-container/20 text-secondary'
                              : 'border-error bg-error-container/20 text-error'
                            : 'border-outline-variant/50 bg-surface text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20'
                       }`}
                     />
                     {!hasAnsweredCurrent && (
                       <button 
                         onClick={submitTitaAnswer}
                         disabled={!titaInput.trim()}
                         className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-lg font-bold hover:bg-primary-container disabled:opacity-50 transition-colors shrink-0 shadow-sm"
                       >
                         Submit
                       </button>
                     )}
                   </div>
                   
                   {hasAnsweredCurrent && (
                     <div className="mt-space-md p-space-md bg-surface rounded-xl border border-surface-variant flex items-center">
                       <span className="material-symbols-outlined text-secondary text-[20px] mr-2">verified</span>
                       <p className="font-label-lg text-on-surface">
                         Correct Answer: <span className="text-secondary font-bold ml-1">{currentQuestion.correctAnswer}</span>
                       </p>
                     </div>
                   )}
                </div>
              )}
            </div>
            
            <div className="p-space-lg border-t border-surface-variant bg-surface-container-lowest flex justify-between">
              <button 
                onClick={handlePrev}
                disabled={isFirstQuestion}
                className="flex items-center text-on-surface-variant hover:text-on-surface px-6 py-3 rounded-lg font-label-lg disabled:opacity-40 transition-colors bg-surface hover:bg-surface-container-high border border-outline-variant/40"
              >
                <span className="material-symbols-outlined text-[20px] mr-2">chevron_left</span> Previous
              </button>

              <button 
                onClick={handleNext}
                disabled={!hasAnsweredCurrent}
                className="flex items-center bg-primary text-on-primary px-8 py-3 rounded-lg font-label-lg font-bold disabled:opacity-50 transition-all shadow-sm hover:bg-primary-container"
              >
                {isLastQuestion ? 'Complete Simulation' : 'Next Question'} 
                {!isLastQuestion && <span className="material-symbols-outlined text-[20px] ml-2">chevron_right</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        {type === 'custom' && (
          <div className="w-80 shrink-0 hidden lg:block">
            <div className="sticky top-24 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-space-lg h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center space-x-3 mb-space-md">
                <span className="material-symbols-outlined text-primary text-[24px]">leaderboard</span>
                <h3 className="font-title-md text-[18px] text-on-surface font-bold">Live Combatants</h3>
              </div>
              
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="font-body-sm text-on-surface-variant text-center py-4">Awaiting competitors...</p>
                ) : leaderboard.map((l, idx) => (
                  <div key={l.userId} className={`flex items-center justify-between p-3 rounded-lg border ${l.userId === user?.id ? 'bg-primary-container/10 border-primary/20 shadow-sm' : 'bg-surface border-transparent'}`}>
                    <div className="flex items-center space-x-3">
                      <span className={`font-label-md font-bold w-6 text-center ${idx === 0 ? 'text-tertiary-container' : idx === 1 ? 'text-outline' : idx === 2 ? 'text-secondary-fixed-dim' : 'text-outline-variant'}`}>
                        #{idx + 1}
                      </span>
                      <div className="truncate max-w-[100px]">
                        <span className="font-body-sm font-semibold text-on-surface truncate block">{l.name}</span>
                        {l.isFinished && <span className="font-label-sm text-[9px] uppercase font-bold text-secondary">Finished</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-title-md font-bold text-primary">{l.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

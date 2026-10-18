'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { CheckCircle, XCircle, Swords, Trophy, Zap, Lock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface BattleSyncData {
  currentQIndex: number;
  p1Score: number;
  p2Score: number;
  p1Id: string;
  p2Id: string;
  questionClaimed: boolean;
  claimedBy: string | null;
  isLocked: boolean;
}

interface QuestionResolvedData {
  questionIndex: number;
  claimedBy: string | null;
  isCorrect: boolean;
  correctAnswer: string;
  selectedOption: string;
  p1Score: number;
  p2Score: number;
}

interface BattleCompletedData {
  battleId: string;
  p1Score: number;
  p2Score: number;
  winnerId: string | null;
  isDraw: boolean;
}

type ResolutionStatus =
  | 'idle'
  | 'claimed_by_me'
  | 'claimed_by_opponent'
  | 'my_answer_wrong'
  | 'opponent_missed'
  | 'both_missed';

export default function BattleArena() {
  const { id } = useParams();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [battleData, setBattleData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [p1Id, setP1Id] = useState<string | null>(null);
  const [p2Id, setP2Id] = useState<string | null>(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isQuestionClaimed, setIsQuestionClaimed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [resolvedAnswer, setResolvedAnswer] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus>('idle');

  const [isFinished, setIsFinished] = useState(false);
  const [completedData, setCompletedData] = useState<BattleCompletedData | null>(null);

  const currentQIndexRef = useRef(currentQIndex);
  useEffect(() => {
    currentQIndexRef.current = currentQIndex;
  }, [currentQIndex]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
      } catch (err) {
        console.error('Invalid token payload:', err);
      }
    }

    const data = localStorage.getItem('battle_data');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setBattleData(parsed);
        if (parsed.p1Id) setP1Id(parsed.p1Id);
        if (parsed.p2Id) setP2Id(parsed.p2Id);
      } catch (err) {
        console.error('Failed to parse battle_data:', err);
        router.push('/dashboard/battle');
      }
    } else {
      router.push('/dashboard/battle');
    }
  }, [router]);

  useEffect(() => {
    if (!userId || !battleData) return;

    const newSocket = getSocket();
    setSocket(newSocket);

    // Join the battle room
    newSocket.emit('join_battle', { battleId: id, userId });

    // Handle full state sync on connect / reconnect
    newSocket.on('battle_sync', (data: BattleSyncData) => {
      setCurrentQIndex(data.currentQIndex);
      setP1Score(data.p1Score);
      setP2Score(data.p2Score);
      if (data.p1Id) setP1Id(data.p1Id);
      if (data.p2Id) setP2Id(data.p2Id);
      setIsQuestionClaimed(data.questionClaimed);
      setIsLocked(data.isLocked);

      if (data.questionClaimed) {
        if (data.claimedBy === userId) {
          setResolutionStatus('claimed_by_me');
        } else if (data.claimedBy) {
          setResolutionStatus('claimed_by_opponent');
        } else {
          setResolutionStatus('both_missed');
        }
      } else {
        setResolutionStatus('idle');
      }
    });

    // Instant resolution when someone claims the point or both fail
    newSocket.on('question_resolved', (data: QuestionResolvedData) => {
      // Immediate score reflection!
      setP1Score(data.p1Score);
      setP2Score(data.p2Score);
      setIsQuestionClaimed(true);
      setIsLocked(true);
      setResolvedAnswer(data.correctAnswer);

      if (data.claimedBy === userId) {
        setResolutionStatus('claimed_by_me');
      } else if (data.claimedBy) {
        setResolutionStatus('claimed_by_opponent');
      } else {
        setResolutionStatus('both_missed');
      }
    });

    // When the answering player misses
    newSocket.on('answer_incorrect', (data: { questionIndex: number; selectedOption: string }) => {
      setIsLocked(true);
      setResolutionStatus('my_answer_wrong');
    });

    // When the opponent misses, alert this user that the point is still available!
    newSocket.on('opponent_missed', () => {
      // If this player hasn't locked themselves out yet, let them know!
      setResolutionStatus((prev) => (prev === 'idle' ? 'opponent_missed' : prev));
    });

    // Advance to next question simultaneously
    newSocket.on('next_question', (data: { currentQIndex: number; p1Score: number; p2Score: number }) => {
      setCurrentQIndex(data.currentQIndex);
      setP1Score(data.p1Score);
      setP2Score(data.p2Score);
      setIsLocked(false);
      setIsQuestionClaimed(false);
      setSelectedOption(null);
      setResolvedAnswer(null);
      setResolutionStatus('idle');
    });

    // Battle ended
    newSocket.on('battle_completed', (data: BattleCompletedData) => {
      setP1Score(data.p1Score);
      setP2Score(data.p2Score);
      setCompletedData(data);
      setIsFinished(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId, battleData, id]);

  if (!battleData || !battleData.questions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-body-md text-on-surface-variant animate-pulse">Entering 1v1 Arena...</p>
      </div>
    );
  }

  const isP1 = userId === (p1Id || battleData.p1Id);
  const myScore = isP1 ? p1Score : p2Score;
  const oppScore = isP1 ? p2Score : p1Score;

  const questions = battleData.questions;
  const currentQuestion = questions[currentQIndex];

  const handleAnswer = (optionKey: string) => {
    if (isLocked || isQuestionClaimed || !currentQuestion) return;

    // Immediately lock user's UI to avoid double-tap race conditions
    setIsLocked(true);
    setSelectedOption(optionKey);

    socket?.emit('submit_answer', {
      battleId: id,
      userId,
      optionKey,
      questionIndex: currentQIndex,
    });
  };

  // Render Game Over Screen
  if (isFinished || currentQIndex >= questions.length) {
    const winnerId = completedData?.winnerId;
    const isWinner = winnerId === userId;
    const isDraw = completedData?.isDraw ?? (myScore === oppScore);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-6 flex justify-center">
          {isWinner ? (
            <div className="w-20 h-20 rounded-2xl bg-secondary/15 flex items-center justify-center border-2 border-secondary/30 shadow-lg shadow-secondary/10">
              <Trophy className="w-10 h-10 text-secondary" />
            </div>
          ) : isDraw ? (
            <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center border-2 border-primary/30 shadow-lg shadow-primary/10">
              <Swords className="w-10 h-10 text-primary" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-error/15 flex items-center justify-center border-2 border-error/30 shadow-lg shadow-error/10">
              <ShieldAlert className="w-10 h-10 text-error" />
            </div>
          )}
        </div>

        <h1 className="font-display text-4xl font-extrabold text-on-surface tracking-tight mb-2">
          {isWinner ? 'VICTORY!' : isDraw ? 'DRAW GAME' : 'DEFEAT'}
        </h1>
        <p className="font-body-md text-on-surface-variant mb-8">
          {isWinner
            ? 'Outstanding reflexes and accuracy! You dominated the speed duel.'
            : isDraw
            ? 'Evenly matched duelists! Both claimed an equal share of questions.'
            : 'Close match! Fast-fingered speed makes all the difference.'}
        </p>

        {/* ELO Rating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-label-md font-bold uppercase tracking-wider shadow-sm border border-outline-variant/30 bg-surface-container-low">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span>MMR Update:</span>
          <span className={isWinner ? 'text-secondary font-black' : isDraw ? 'text-on-surface-variant' : 'text-error font-black'}>
            {isWinner ? '+25 ELO' : isDraw ? '+0 ELO' : '-15 ELO'}
          </span>
        </div>

        {/* Final Scoreboard */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-surface-container-lowest rounded-2xl p-6 border-2 border-primary/20 shadow-sm relative overflow-hidden">
            <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
              YOU
            </span>
            <p className="font-display text-6xl font-black text-primary">{myScore}</p>
            {isWinner && (
              <span className="mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
                Winner
              </span>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 border-2 border-outline-variant/30 shadow-sm relative overflow-hidden">
            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">
              OPPONENT
            </span>
            <p className="font-display text-6xl font-black text-on-surface">{oppScore}</p>
            {!isWinner && !isDraw && (
              <span className="mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-error/15 text-error">
                Winner
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard/battle')}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-3.5 rounded-xl font-label-md font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            Play Another Duel
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-surface-container-high text-on-surface px-6 py-3.5 rounded-xl font-label-md font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-colors active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* HUD Bar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-variant p-5 mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* User Score Card */}
          <div className="flex items-center gap-3 w-36">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-label-lg font-black text-primary text-xl">{myScore}</span>
            </div>
            <div>
              <p className="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">YOU</p>
              <p className="font-body-xs text-[11px] text-on-surface-variant">Duelist</p>
            </div>
          </div>

          {/* Center Info & Progress */}
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-xs font-semibold uppercase tracking-wider mb-2">
              <Swords className="w-4 h-4 text-primary" />
              <span>Speed Duel • Question {currentQIndex + 1} of {questions.length}</span>
            </div>

            {/* Stepper Dots */}
            <div className="flex gap-2 w-full max-w-xs">
              {questions.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    idx < currentQIndex
                      ? 'bg-primary'
                      : idx === currentQIndex
                      ? 'bg-secondary ring-2 ring-secondary/30'
                      : 'bg-surface-container-highest'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Opponent Score Card */}
          <div className="flex items-center justify-end gap-3 w-36 text-right">
            <div>
              <p className="font-label-sm text-xs font-bold text-error uppercase tracking-wider">OPPONENT</p>
              <p className="font-body-xs text-[11px] text-on-surface-variant">Challenger</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center">
              <span className="font-label-lg font-black text-error text-xl">{oppScore}</span>
            </div>
          </div>
        </div>

        {/* Real-time Status Notification Banner */}
        <div className="mt-4 pt-4 border-t border-surface-variant flex items-center justify-center">
          {resolutionStatus === 'idle' && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <Zap className="w-4 h-4 text-secondary animate-pulse" />
              <span>First player to choose the correct answer claims the point!</span>
            </div>
          )}

          {resolutionStatus === 'claimed_by_me' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/15 text-secondary text-xs font-bold animate-in fade-in zoom-in-95">
              <Zap className="w-4 h-4 fill-secondary" />
              <span>⚡ YOU CLAIMED THE POINT! Lightning fast! (+1)</span>
            </div>
          )}

          {resolutionStatus === 'claimed_by_opponent' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error/15 text-error text-xs font-bold animate-in fade-in zoom-in-95">
              <Lock className="w-4 h-4" />
              <span>🔒 LOCKED OUT! Opponent marked the correct answer first!</span>
            </div>
          )}

          {resolutionStatus === 'my_answer_wrong' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error/15 text-error text-xs font-bold animate-in fade-in zoom-in-95">
              <XCircle className="w-4 h-4" />
              <span>❌ INCORRECT! You are locked out of this question.</span>
            </div>
          )}

          {resolutionStatus === 'opponent_missed' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/15 text-secondary text-xs font-bold animate-in fade-in zoom-in-95">
              <Zap className="w-4 h-4 text-secondary animate-bounce" />
              <span>🔥 OPPONENT MISSED! Quick, pick the right answer to steal the point!</span>
            </div>
          )}

          {resolutionStatus === 'both_missed' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold animate-in fade-in">
              <XCircle className="w-4 h-4" />
              <span>Both players missed! Advancing to next question...</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant overflow-hidden">
        <div className="p-8 border-b border-surface-variant bg-gradient-to-b from-surface-container-low/40 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10">
              {currentQuestion.category || 'Aptitude'}
            </span>
            <span className="font-label-sm text-xs font-semibold text-on-surface-variant">
              Speed Question {currentQIndex + 1}/{questions.length}
            </span>
          </div>
          <p className="font-body-lg text-lg text-on-surface font-medium leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Options List */}
        <div className="p-8 bg-surface-container-low/30">
          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const isSelected = selectedOption === key;
              const isCorrectAnswer = resolvedAnswer === key;
              const isLockedOut = isLocked || isQuestionClaimed;

              let btnStyles =
                'border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:border-primary/50 hover:bg-primary/5';

              if (resolvedAnswer) {
                if (isCorrectAnswer) {
                  btnStyles = 'border-secondary bg-secondary/10 text-secondary font-bold shadow-sm';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyles = 'border-error bg-error/10 text-error font-medium line-through';
                } else {
                  btnStyles = 'border-outline-variant/20 bg-surface-container-lowest/50 text-on-surface-variant opacity-60';
                }
              } else if (isSelected) {
                btnStyles = 'border-primary bg-primary/10 text-primary font-bold';
              } else if (isLockedOut) {
                btnStyles = 'border-outline-variant/20 bg-surface-container-lowest/50 text-on-surface-variant opacity-60 cursor-not-allowed';
              }

              return (
                <button
                  key={key}
                  disabled={isLockedOut}
                  onClick={() => handleAnswer(key)}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all text-left relative group ${btnStyles}`}
                >
                  <span
                    className={`font-label-md font-bold w-10 text-base transition-colors ${
                      isCorrectAnswer
                        ? 'text-secondary'
                        : isSelected
                        ? 'text-primary'
                        : 'text-on-surface-variant group-hover:text-primary'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="flex-1 font-body-md text-base">{String(value)}</span>

                  {resolvedAnswer && isCorrectAnswer && (
                    <div className="flex items-center gap-1.5 text-secondary font-label-sm text-xs font-bold">
                      <CheckCircle className="w-5 h-5" />
                      <span>Correct</span>
                    </div>
                  )}

                  {resolvedAnswer && isSelected && !isCorrectAnswer && (
                    <div className="flex items-center gap-1.5 text-error font-label-sm text-xs font-bold">
                      <XCircle className="w-5 h-5" />
                      <span>Miss</span>
                    </div>
                  )}

                  {isLockedOut && !resolvedAnswer && !isSelected && (
                    <Lock className="w-4 h-4 text-on-surface-variant/40 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


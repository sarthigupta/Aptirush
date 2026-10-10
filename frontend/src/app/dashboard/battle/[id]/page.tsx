'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { CheckCircle, XCircle, Swords } from 'lucide-react';
import { api } from '@/lib/api';

export default function BattleArena() {
  const { id } = useParams();
  const router = useRouter();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [battleData, setBattleData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
    }
    
    const data = localStorage.getItem('battle_data');
    if (data) {
      setBattleData(JSON.parse(data));
    } else {
      router.push('/dashboard/battle');
    }
  }, [router]);

  useEffect(() => {
    if (!userId || !battleData) return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join_battle', { battleId: id, userId });

    newSocket.on('opponent_progress', (data) => {
      setOpponentScore(data.score);
    });

    newSocket.on('opponent_finished', (data) => {
      setOpponentScore(data.score);
      setOpponentFinished(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId, battleData, id]);

  if (!battleData) return <div>Loading arena...</div>;

  const questions = battleData.questions;
  const currentQuestion = questions[currentQIndex];

  const handleAnswer = (optionKey: string) => {
    const isCorrect = optionKey === currentQuestion.correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    socket?.emit('submit_answer', { battleId: id, userId, score: newScore });

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      finishBattle(newScore);
    }
  };

  const finishBattle = (finalScore: number) => {
    setIsFinished(true);
    socket?.emit('battle_over', { battleId: id, userId, score: finalScore });
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-4xl font-black mb-8 text-gray-900">BATTLE OVER</h1>
        
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-indigo-50 rounded-2xl p-8 border-2 border-indigo-100">
            <h2 className="text-xl font-bold text-indigo-900 mb-2">YOU</h2>
            <p className="text-6xl font-black text-indigo-600">{score}</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-100 relative">
            <h2 className="text-xl font-bold text-red-900 mb-2">OPPONENT</h2>
            <p className="text-6xl font-black text-red-600">{opponentScore}</p>
            {!opponentFinished && (
              <span className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                Playing...
              </span>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/dashboard/battle')}
          className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center justify-between">
        <div className="text-center w-32">
          <p className="text-sm font-bold text-indigo-600 uppercase mb-1">YOU</p>
          <div className="text-3xl font-black text-gray-900">{score}</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center px-8">
          <Swords className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-400">Question {currentQIndex + 1} of {questions.length}</p>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
             <div 
               className="bg-indigo-500 h-full transition-all duration-300"
               style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
             ></div>
          </div>
        </div>
        
        <div className="text-center w-32">
          <p className="text-sm font-bold text-red-600 uppercase mb-1">OPPONENT</p>
          <div className="text-3xl font-black text-gray-900">{opponentScore}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <p className="text-xl text-gray-800 font-medium leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>
        
        <div className="p-8 bg-gray-50/50">
           <div className="space-y-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  className="w-full flex items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50 transition-all group text-left"
                >
                  <span className="font-bold w-10 text-gray-400 group-hover:text-indigo-600 transition-colors text-lg">{key}</span>
                  <span className="flex-1 font-medium text-gray-700 group-hover:text-gray-900">
                    {String(value)}
                  </span>
                </button>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}

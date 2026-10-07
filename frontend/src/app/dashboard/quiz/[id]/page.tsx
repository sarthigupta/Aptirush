'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, ChevronRight, ChevronLeft, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [module, setModule] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titaInput, setTitaInput] = useState('');

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await api.get(`/student/modules/${id}`);
        setModule(res.data);
      } catch (err) {
        console.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading quiz...</div>;
  if (!module) return <div className="p-8 text-center text-red-500">Quiz not found</div>;

  const questions = module.questions || [];
  
  if (questions.length === 0) {
    return <div className="p-8 text-center text-gray-500">No published questions available for this module yet.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const hasAnsweredCurrent = !!answers[currentQuestion.id];

  const handleSelectOption = (optionKey: string) => {
    if (hasAnsweredCurrent) return; // Prevent changing answer after it's locked
    setAnswers({ ...answers, [currentQuestion.id]: optionKey });
  };

  const submitTitaAnswer = () => {
    if (hasAnsweredCurrent || !titaInput.trim()) return;
    setAnswers({ ...answers, [currentQuestion.id]: titaInput.trim() });
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(curr => curr + 1);
      setTitaInput('');
    } else {
      setIsFinished(true);
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
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
          <p className="text-gray-500 mb-8">You finished {module.title}</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Your Score</p>
            <p className="text-5xl font-bold text-gray-900">{score} <span className="text-2xl text-gray-400">/ {questions.length}</span></p>
          </div>
          
          <button 
            onClick={() => router.push('/dashboard/tests')}
            className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      <button 
        onClick={() => router.push('/dashboard/tests')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {currentQuestion.type}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <p className="text-lg text-gray-800 font-medium leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>
        
        <div className="p-8 bg-gray-50/50">
          {currentQuestion.type === 'MCQ' ? (
            <div className="space-y-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = answers[currentQuestion.id] === key;
                const isCorrect = key === currentQuestion.correctAnswer;
                
                let buttonStyle = "border-gray-200 bg-white hover:border-gray-300";
                
                // Immediately reveal answer status if the user has already answered this question
                if (hasAnsweredCurrent) {
                  if (isCorrect) {
                    buttonStyle = "border-green-500 bg-green-50 text-green-900";
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = "border-red-500 bg-red-50 text-red-900";
                  } else {
                    buttonStyle = "border-gray-200 bg-white opacity-50 cursor-not-allowed";
                  }
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    disabled={hasAnsweredCurrent}
                    className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${buttonStyle}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 ${
                      hasAnsweredCurrent && isCorrect ? 'border-green-500 bg-green-500' :
                      hasAnsweredCurrent && isSelected && !isCorrect ? 'border-red-500 bg-red-500' :
                      'border-gray-300'
                    }`}>
                      {hasAnsweredCurrent && isCorrect && <CheckCircle className="w-4 h-4 text-white" />}
                      {hasAnsweredCurrent && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-semibold w-8 shrink-0 text-left">{key}.</span>
                    <span className="text-left flex-1 font-medium">
                      {String(value)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
               <p className="text-sm text-gray-500 mb-3">Type your answer below:</p>
               <div className="flex space-x-4">
                 <input 
                   type="text" 
                   value={hasAnsweredCurrent ? answers[currentQuestion.id] : titaInput}
                   onChange={(e) => setTitaInput(e.target.value)}
                   disabled={hasAnsweredCurrent}
                   placeholder="Your answer"
                   className={`flex-1 border-2 rounded-lg p-4 focus:ring-2 outline-none ${
                      hasAnsweredCurrent 
                        ? answers[currentQuestion.id]?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-300 focus:ring-gray-900 bg-white'
                   }`}
                 />
                 {!hasAnsweredCurrent && (
                   <button 
                     onClick={submitTitaAnswer}
                     disabled={!titaInput.trim()}
                     className="bg-gray-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                   >
                     Submit
                   </button>
                 )}
               </div>
               
               {/* Reveal the correct answer immediately after they submit */}
               {hasAnsweredCurrent && (
                 <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                   <p className="text-sm font-medium text-gray-700">
                     Correct Answer: <span className="text-green-600 font-bold ml-2">{currentQuestion.correctAnswer}</span>
                   </p>
                 </div>
               )}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-white flex justify-between">
          <button 
            onClick={handlePrev}
            disabled={isFirstQuestion}
            className="flex items-center text-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </button>

          <button 
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className="flex items-center bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'} 
            {!isLastQuestion && <ChevronRight className="w-4 h-4 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Check, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function CreateTestPage() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/faculty/questions')
      .then(res => {
        const validModules = res.data.filter((m: any) => m.questions.length > 0);
        setModules(validModules);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleQuestion = (id: string) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedQuestions(newSet);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please provide a test title.');
      return;
    }
    if (selectedQuestions.size === 0) {
      setError('Please select at least one question.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/faculty/tests', {
        title,
        questionIds: Array.from(selectedQuestions)
      });
      router.push('/faculty/dashboard/tests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create test');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-4" /> Loading question bank...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center space-x-4">
        <Link href="/faculty/dashboard/tests" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Custom Test</h2>
          <p className="mt-1 text-sm text-gray-500">Select questions from the bank to create a new assessment.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Title
        </label>
        <input 
          type="text" 
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Midterm Aptitude Assessment"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none text-gray-900 transition-all"
        />
      </div>

      <div className="space-y-6">
        {modules.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No questions available</h3>
            <p className="text-gray-500">The admin hasn't published any questions yet.</p>
          </div>
        )}
        
        {modules.map(module => (
          <div key={module.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center">
              <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
              <span className="ml-auto text-sm text-gray-500">{module.questions.length} questions available</span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {module.questions.map((q: any) => {
                const isSelected = selectedQuestions.has(q.id);
                return (
                  <div 
                    key={q.id} 
                    onClick={() => toggleQuestion(q.id)}
                    className={`px-6 py-4 flex items-start cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center mr-4 shrink-0 transition-colors ${
                      isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                        {q.questionText}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {q.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky bottom-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700">
            <span className="text-gray-900 font-bold">{selectedQuestions.size}</span> questions selected
          </p>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-gray-900 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Save & Publish Test
          </button>
        </div>
      </div>
    </div>
  );
}

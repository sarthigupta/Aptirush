'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Check, Edit2, X, CheckCircle, Loader2 } from 'lucide-react';

export default function ReviewQueuePage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/admin/questions/needs-review');
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setEditForm({
      questionText: q.questionText,
      options: q.options ? JSON.stringify(q.options, null, 2) : '{}',
      correctAnswer: q.correctAnswer
    });
  };

  const handlePublish = async (id: string, isEditing: boolean) => {
    setPublishingId(id);
    try {
      let payload = {};
      if (isEditing) {
         payload = {
           questionText: editForm.questionText,
           options: JSON.parse(editForm.options),
           correctAnswer: editForm.correctAnswer
         };
      } else {
         const q = questions.find(q => q.id === id);
         payload = {
           questionText: q.questionText,
           options: q.options,
           correctAnswer: q.correctAnswer
         };
      }
      
      await api.patch(`/admin/questions/${id}`, payload);
      // Remove from list
      setQuestions(questions.filter(q => q.id !== id));
      setEditingId(null);
    } catch (err: any) {
      alert('Failed to publish: ' + (err.message || 'Check JSON format for options'));
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-4" /> Loading review queue...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Queue</h2>
        <p className="mt-1 text-sm text-gray-500">Fix OCR mistakes and publish these flagged questions.</p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">All Caught Up!</h3>
          <p className="text-gray-500">There are no questions needing review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map(q => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600 font-medium">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {q.module?.title}
                </div>
                <div className="flex space-x-3">
                  {editingId !== q.id ? (
                    <>
                      <button 
                        onClick={() => handleEdit(q)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handlePublish(q.id, false)}
                        disabled={publishingId === q.id}
                        className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 flex items-center px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
                      >
                        {publishingId === q.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />} 
                        Looks Good, Publish
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4 mr-1.5" /> Cancel
                      </button>
                      <button 
                        onClick={() => handlePublish(q.id, true)}
                        disabled={publishingId === q.id}
                        className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
                      >
                        {publishingId === q.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />} 
                        Save & Publish
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {editingId === q.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                        rows={3}
                        value={editForm.questionText}
                        onChange={(e) => setEditForm({...editForm, questionText: e.target.value})}
                      />
                    </div>
                    {q.type === 'MCQ' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Options (JSON format)</label>
                        <textarea 
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-gray-900 outline-none"
                          rows={6}
                          value={editForm.options}
                          onChange={(e) => setEditForm({...editForm, options: e.target.value})}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                      <input 
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                        value={editForm.correctAnswer}
                        onChange={(e) => setEditForm({...editForm, correctAnswer: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-900 font-medium text-lg mb-6">{q.questionText}</p>
                    {q.type === 'MCQ' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(q.options || {}).map(([key, val]) => (
                          <div 
                            key={key} 
                            className={`p-3 rounded-lg border flex items-start ${key === q.correctAnswer ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                          >
                            <span className="font-semibold text-gray-700 w-6 shrink-0">{key}.</span>
                            <span className="text-gray-700 text-sm">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                        <span className="text-sm font-medium text-gray-500">Correct Answer: </span>
                        <span className="text-gray-900 font-bold ml-2">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

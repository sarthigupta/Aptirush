'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Play } from 'lucide-react';
import { api } from '@/lib/api';

export default function MyTestsPage() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModules() {
      try {
        const res = await api.get('/student/modules');
        setModules(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchModules();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">My Tests</h2>
        <p className="mt-1 text-sm text-gray-500">Available modules and quizzes for your practice.</p>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading tests...</div>
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center">
          <p className="text-gray-500">No modules available yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{mod.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Chapter {mod.chapterNumber || 'N/A'}
                </p>
                <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg inline-flex">
                  {mod._count?.questions || 0} Questions
                </div>
              </div>
              <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                <button
                  onClick={() => router.push(`/dashboard/quiz/${mod.id}`)}
                  className="w-full flex items-center justify-center bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" /> Start Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { ArrowRight, Clock, Target, Trophy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard-stats')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-gray-500 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-4" /> Loading dashboard...</div>;
  }

  const stats = [
    { name: 'Tests Completed', value: data?.stats?.testsCompleted || '0', icon: Trophy, change: 'Keep it up!', positive: true },
    { name: 'Average Score', value: data?.stats?.averageScore || '0%', icon: Target, change: 'Lifetime average', positive: true },
    { name: 'Time Spent', value: data?.stats?.timeSpent || '0h', icon: Clock, change: 'Not tracked', positive: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h2>
        <p className="mt-1 text-sm text-gray-500">Your recent performance and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`${
                  stat.positive === true ? 'text-green-600' : 
                  stat.positive === false ? 'text-red-600' : 
                  'text-gray-500'
                } font-medium`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Tests</h3>
            <button 
              onClick={() => router.push('/dashboard/tests')}
              className="text-sm text-gray-600 font-medium hover:text-gray-900 flex items-center transition-colors"
            >
              Take more tests <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {(!data?.recentTests || data.recentTests.length === 0) ? (
              <div className="p-8 text-center text-gray-500">You haven't completed any tests yet.</div>
            ) : data.recentTests.map((test: any, i: number) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="truncate pr-4">
                  <p className="font-medium text-gray-900 truncate">{test.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{test.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{test.score}</p>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 inline-block ${
                    test.status === 'Passed' 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                  }`}>
                    {test.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Recommended Next</h3>
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Advanced Verbal Reasoning</h4>
                  <p className="text-sm text-gray-500 mt-1">Based on your recent performance, practice these questions to improve your score.</p>
                </div>
                <span className="shrink-0 bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded ml-3">
                  45 mins
                </span>
              </div>
              <button className="mt-5 w-full bg-white border border-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

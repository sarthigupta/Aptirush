'use client';

import { ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AdminRecentJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/admin/documents');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Automatically fetch jobs every 10 seconds to keep the list fresh
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async (jobId: string) => {
    setSyncingId(jobId);
    try {
      const res = await api.get(`/admin/documents/${jobId}/sync`);
      if (res.status === 200) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'COMPLETED' } : j));
      } else {
        alert(res.data.message || 'Still processing...');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sync');
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
     return (
       <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex items-center justify-center p-12">
         <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
       </div>
     );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Recent Document Jobs</h3>
        <button className="text-sm text-gray-600 font-medium hover:text-gray-900 flex items-center transition-colors">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
        {jobs.length === 0 ? (
           <div className="p-6 text-center text-gray-500">No documents uploaded yet.</div>
        ) : jobs.map((job) => (
          <div key={job.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
            <div className="truncate pr-4">
              <p className="font-medium text-gray-900 truncate" title={job.filename}>{job.filename}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(job.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-4 shrink-0">
              <div className="text-right">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-block ${
                  job.status === 'COMPLETED' 
                    ? 'bg-green-50 text-green-700 border border-green-100' 
                    : job.status === 'FAILED'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                }`}>
                  {job.status}
                </span>
              </div>
              {job.status === 'PENDING' && (
                <button
                  onClick={() => handleSync(job.id)}
                  disabled={syncingId === job.id}
                  title="Sync with AWS"
                  className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingId === job.id ? 'animate-spin text-gray-900' : ''}`} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Users, Search } from 'lucide-react';

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/students')
      .then(res => setStudents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-gray-500 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-4" /> Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">My Students</h2>
        <p className="mt-1 text-sm text-gray-500">View and track the performance of your assigned students.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none w-64"
            />
          </div>
        </div>
        
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No students assigned</h3>
            <p className="text-gray-500">You don't have any students assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Tests Completed</th>
                  <th className="px-6 py-4 text-center">Average Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                        {student.totalTests}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block font-bold ${
                        parseInt(student.avgScore) >= 70 ? 'text-green-600' : 
                        parseInt(student.avgScore) > 0 ? 'text-yellow-600' : 'text-gray-400'
                      }`}>
                        {student.avgScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { Trophy, FileText, Settings, Users } from 'lucide-react';
import DocumentUploader from '@/components/admin/DocumentUploader';

export default function AdminDashboard() {
  const stats = [
    { name: 'Total Students', value: '142', icon: Users },
    { name: 'Active Modules', value: '12', icon: FileText },
    { name: 'Needs Review', value: '5', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">Manage AptiRush platform content and users.</p>
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
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-indigo-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6">
           <h3 className="font-semibold text-gray-900 mb-4">Upload New Module PDF</h3>
           <DocumentUploader />
        </div>
      </div>
    </div>
  );
}

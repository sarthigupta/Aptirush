import AdminStats from '@/components/admin/AdminStats';
import AdminRecentJobs from '@/components/admin/AdminRecentJobs';
import DocumentUploader from '@/components/admin/DocumentUploader';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">Manage AptiRush platform content and users.</p>
      </div>

      <AdminStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <AdminRecentJobs />
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6">
           <h3 className="font-semibold text-gray-900 mb-6">Upload New Module PDF</h3>
           <DocumentUploader />
        </div>
      </div>
    </div>
  );
}

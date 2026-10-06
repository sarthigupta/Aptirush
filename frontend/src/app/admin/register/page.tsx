import AdminSignupForm from '@/components/auth/AdminSignupForm';

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
          <span className="text-indigo-600">AptiRush</span> Admin
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AdminSignupForm />
      </div>
    </div>
  );
}

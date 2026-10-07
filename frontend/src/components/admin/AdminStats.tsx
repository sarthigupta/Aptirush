import { Users, FileText, Settings } from 'lucide-react';

export default function AdminStats() {
  const stats = [
    { name: 'Total Students', value: '142', icon: Users, change: '+12 this week', positive: true },
    { name: 'Active Modules', value: '12', icon: FileText, change: '+2 this month', positive: true },
    { name: 'Needs Review', value: '5', icon: Settings, change: 'Action required', positive: false },
  ];

  return (
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
  );
}

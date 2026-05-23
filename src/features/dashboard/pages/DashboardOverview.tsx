'use client';

import { useAuthStore } from '@/core/auth/stores/auth.store';
import { TrendingUp, ShoppingCart, Users, Clock } from 'lucide-react';

const stats = [
  { label: 'المبيعات اليوم', value: '٢٤٨٠ ر.س', change: '+١٢٪', icon: TrendingUp, color: 'blue' },
  { label: 'الفواتير', value: '٣٤', change: '+٥', icon: ShoppingCart, color: 'emerald' },
  { label: 'العملاء', value: '٢٨', change: '+٣', icon: Users, color: 'purple' },
  { label: 'الوردية', value: '٦ ساعات', change: 'نشطة', icon: Clock, color: 'amber' },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

export function DashboardOverview() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-white">
          مرحباً، {user?.name ?? 'مستخدم'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">إليك ملخص يومك حتى الآن</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Placeholder for charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-5 h-64 flex items-center justify-center">
          <p className="text-slate-600 text-sm">مخطط المبيعات — قادم</p>
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-5 h-64 flex items-center justify-center">
          <p className="text-slate-600 text-sm">آخر الفواتير — قادم</p>
        </div>
      </div>
    </div>
  );
}
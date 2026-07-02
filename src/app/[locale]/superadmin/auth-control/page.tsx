'use client';

import { useTranslations } from 'next-intl';
import { Shield, Clock } from 'lucide-react';

export default function AuthControlPage() {
  const t = useTranslations('common');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Auth Control</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">User & Session Management</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#141720] border border-slate-200 dark:border-[#1e2130] flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-400" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-slate-800 dark:text-white text-lg font-semibold">Coming Soon</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm max-w-sm">
            User authentication control, session management, and password reset tools are under development.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500 bg-slate-100 dark:bg-[#141720] border border-slate-200 dark:border-[#1e2130] rounded-lg px-4 py-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Planned for next release</span>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExpensesList } from './components/ExpensesList';
import { CategoriesList } from './components/CategoriesList';
import { useExpenseStats } from './hooks/useExpenses';
import { formatCurrency } from '@/lib/format';
import { CheckCircle, Clock, DollarSign, XCircle } from 'lucide-react';

export default function ExpensesPage() {
  const t = useTranslations('expenses');
  const [tab, setTab] = useState<'requests' | 'categories'>('requests');
  const { data: stats } = useExpenseStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{t('stats.pending')}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{stats?.pending_count ?? 0}</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{t('stats.approvedToday')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{stats?.approved_count ?? 0}</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{t('stats.totalToday')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_amount ?? 0)}</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{t('stats.expired')}</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{stats?.rejected_count ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-[#141720] border border-[#1e2130] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('tabs.requests')}
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('tabs.templates')}
        </button>
      </div>

      {tab === 'requests' && <ExpensesList />}
      {tab === 'categories' && <CategoriesList />}
    </div>
  );
}
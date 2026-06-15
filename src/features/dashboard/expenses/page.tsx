'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExpenseRequestsList } from './components/ExpenseRequestsList';
import { ExpenseTemplatesList } from './components/ExpenseTemplatesList';

export default function ExpensesPage() {
  const t = useTranslations('expenses');
  const [tab, setTab] = useState<'requests' | 'templates'>('requests');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
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
          onClick={() => setTab('templates')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'templates' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('tabs.templates')}
        </button>
      </div>

      {tab === 'requests' && <ExpenseRequestsList />}
      {tab === 'templates' && <ExpenseTemplatesList />}
    </div>
  );
}
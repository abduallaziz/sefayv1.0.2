'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/shared/ui/page-header';
import { StatCard } from '@/shared/ui/stat-card';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Clock, CheckCircle, DollarSign, XCircle } from 'lucide-react';
import { useExpenseStats } from './hooks/useExpenses';
import { ExpenseRequestsList } from './components/ExpenseRequestsList';
import { ExpenseTemplatesList } from './components/ExpenseTemplatesList';

export default function ExpensesPage() {
  const t = useTranslations('expenses');
  const [tab, setTab] = useState<'requests' | 'templates'>('requests');
  const { data: stats } = useExpenseStats();

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.pending')}
          value={stats?.pending_count ?? 0}
          icon={Clock}
          variant="warning"
          theme="dashboard"
        />
        <StatCard
          title={t('stats.approvedToday')}
          value={stats?.approved_count ?? 0}
          icon={CheckCircle}
          variant="success"
          theme="dashboard"
        />
        <StatCard
          title={t('stats.totalToday')}
          value={stats ? `${stats.total_amount} ر.س` : '—'}
          icon={DollarSign}
          variant="default"
          theme="dashboard"
        />
        <StatCard
          title={t('stats.expired')}
          value={stats?.rejected_count ?? 0}
          icon={XCircle}
          variant="danger"
          theme="dashboard"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'requests' | 'templates')}>
        <TabsList>
          <TabsTrigger value="requests">{t('tabs.requests')}</TabsTrigger>
          <TabsTrigger value="templates">{t('tabs.templates')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'requests' && <ExpenseRequestsList />}
      {tab === 'templates' && <ExpenseTemplatesList />}
    </div>
  );
}
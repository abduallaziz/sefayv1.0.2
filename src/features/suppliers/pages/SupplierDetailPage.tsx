'use client';

import { useTranslations, useLocale } from 'next-intl';
import { PageHeaderSkeleton, CardListSkeleton, TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSupplier, useSupplierProfileStats } from '../hooks/useSuppliers';

interface Props {
  id: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SupplierDetailPage({ id }: Props) {
  const t = useTranslations('suppliers');
  const locale = useLocale();
  const router = useRouter();

  const { data: supplier, isLoading } = useSupplier(id);
  const { data: stats, isLoading: statsLoading } = useSupplierProfileStats(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <CardListSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (!supplier) {
    return <div className="text-center py-16 text-slate-500">{t('notFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/dashboard/suppliers`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{supplier.name}</h1>
          <p className="text-sm text-slate-500">{supplier.contact_name ?? '—'}</p>
        </div>
        <span
          className={`ms-auto px-3 py-1 rounded-full text-xs font-medium ${
            supplier.is_active
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-500/10 text-slate-500'
          }`}
        >
          {supplier.is_active ? t('active') : t('inactive')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('phone')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{supplier.phone ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('email')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{supplier.email ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('address')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{supplier.address ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('paymentTerms')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{supplier.payment_terms ?? '—'}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">{t('purchasingActivity')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t('outstandingPOs')}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {statsLoading ? '—' : stats?.outstanding_po_count ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t('openReceipts')}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {statsLoading ? '—' : stats?.open_receipts_count ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t('totalPurchaseOrders')}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {statsLoading ? '—' : stats?.total_purchase_orders ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t('totalPurchasesValue')}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {statsLoading ? '—' : formatCurrency(stats?.total_purchases_value ?? 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t('inventoryValuePurchased')}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {statsLoading ? '—' : formatCurrency(stats?.inventory_value_purchased ?? 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t('avgLeadTime')}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {statsLoading || stats?.avg_lead_time_days == null
                ? '—'
                : `${stats.avg_lead_time_days.toFixed(1)} ${t('days')}`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
        <p className="text-xs text-slate-500 mb-1">{t('lastPurchaseDate')}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-white">
          {statsLoading ? '—' : stats?.last_purchase_date ?? t('never')}
        </p>
      </div>
    </div>
  );
}

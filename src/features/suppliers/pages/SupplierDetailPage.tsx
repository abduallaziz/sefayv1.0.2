'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeaderSkeleton, CardListSkeleton, TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History } from 'lucide-react';
import { SectionCard } from '@/shared/ui/section-card';
import { DataTable, type Column } from '@/shared/ui/data-table';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatDate } from '@/lib/locale';
import { useItems } from '../../items/hooks/useItems';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useSupplier, useSupplierProfileStats, useSupplierPriceTimeline } from '../hooks/useSuppliers';
import type { SupplierPriceTimelineEntry } from '../types/supplier.types';

interface Props {
  id: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STAGE_TONE: Record<string, StatusTone> = {
  quote: 'neutral',
  purchase_order: 'info',
  goods_receipt: 'success',
};

// #9.6 Supplier Price History & Procurement Price Timeline (Owner-approved).
// Integrated into the existing Supplier detail page, per the approved
// scope ("do not create a new top-level page") — an item selector drives
// GET /purchasing/suppliers/:id/items/:itemId/price-timeline. Stage
// labels/tones/document short-ids come straight from the real backend
// response (SupplierPriceTimelineEntry.stage), never invented — an
// unmapped stage value would fall back to its raw string rather than a
// blank/crashed row, mirroring the wms feature's established
// translateEnum safe-fallback convention (inlined here rather than
// cross-importing from a different feature's lib).
function stageLabel(t: ReturnType<typeof useTranslations>, stage: string): string {
  switch (stage) {
    case 'quote': return t('priceTimelineStageQuote');
    case 'purchase_order': return t('priceTimelineStagePurchaseOrder');
    case 'goods_receipt': return t('priceTimelineStageGoodsReceipt');
    default:
      console.warn(`[suppliers] unmapped price timeline stage from backend: "${stage}"`);
      return stage;
  }
}

export function SupplierDetailPage({ id }: Props) {
  const t = useTranslations('suppliers');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';
  const router = useRouter();

  const { data: supplier, isLoading } = useSupplier(id);
  const { data: stats, isLoading: statsLoading } = useSupplierProfileStats(id);

  const { data: items = [] } = useItems();
  const { data: warehouses = [] } = useWarehouses();
  const warehouseName = (whId: string | null) => (whId ? (warehouses.find((w) => w.id === whId)?.name ?? whId.slice(0, 8)) : '—');
  const [timelineItemId, setTimelineItemId] = useState('');
  const [timelinePage, setTimelinePage] = useState(1);
  const timelinePerPage = 20;
  const timeline = useSupplierPriceTimeline(id, timelineItemId || null, { page: timelinePage, limit: timelinePerPage });
  const timelineRows = timeline.data?.data ?? [];
  const timelineTotal = timeline.data?.total ?? 0;
  const timelineTotalPages = Math.max(1, Math.ceil(timelineTotal / timelinePerPage));

  const timelineColumns: Column<SupplierPriceTimelineEntry>[] = [
    { key: 'date', header: t('priceTimelineColumnDate'), render: (row) => formatDate(row.date, { locale, format: 'short' }) },
    { key: 'stage', header: t('priceTimelineColumnStage'), render: (row) => <StatusBadge tone={STAGE_TONE[row.stage] ?? 'neutral'} label={stageLabel(t, row.stage)} /> },
    { key: 'price', header: t('priceTimelineColumnPrice'), render: (row) => <span className="tabular-nums">{formatCurrency(row.price)}</span> },
    { key: 'document', header: t('priceTimelineColumnDocument'), render: (row) => <span className="font-mono text-xs">{row.document_id.slice(0, 8)}</span> },
    { key: 'warehouse', header: t('priceTimelineColumnWarehouse'), render: (row) => warehouseName(row.warehouse_id) },
  ];

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

      <SectionCard title={t('priceTimelineTitle')} theme="dashboard">
        <div className="space-y-3">
          <select
            value={timelineItemId}
            onChange={(e) => { setTimelineItemId(e.target.value); setTimelinePage(1); }}
            aria-label={t('priceTimelineSelectItem')}
            className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
          >
            <option value="">{t('priceTimelineSelectItem')}</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>

          {!timelineItemId ? (
            <p className="text-sm text-slate-500">{t('priceTimelineNoItem')}</p>
          ) : timeline.isError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-300/40 bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-400">
              {t('priceTimelineError')}
            </div>
          ) : (
            <>
              <DataTable
                columns={timelineColumns}
                data={timelineRows}
                keyExtractor={(row, i) => `${row.stage}-${row.document_id}-${i}`}
                theme="dashboard"
                loading={timeline.isLoading}
                emptyState={
                  <EmptyState
                    icon={History}
                    theme="inventory"
                    size="sm"
                    title={t('priceTimelineEmptyTitle')}
                    description={t('priceTimelineEmptyDescription')}
                  />
                }
              />
              {!timeline.isLoading && timelineRows.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">{t('priceTimelineCount', { count: timelineTotal })}</span>
                  {timelineTotalPages > 1 && <Pagination page={timelinePage} totalPages={timelineTotalPages} onChange={setTimelinePage} />}
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { FileBarChart, Warehouse, AlertTriangle } from 'lucide-react';
import { useInventoryReports } from '../hooks/useInventoryReports';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F1FB] dark:bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5] capitalize">
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-slate-500 py-6 text-center">{label}</p>;
}

export function InventoryReportsPage() {
  const t = useTranslations('inventoryReports');
  const { data, isLoading } = useInventoryReports();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <FileBarChart size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        </div>
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      </div>
    );
  }

  const {
    purchaseOrders,
    goodsReceipts,
    adjustments,
    transfers,
    stockCountsVariance,
    warehouseValuation,
    lowStock,
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
          <FileBarChart size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportCard title={t('warehouseValuation')}>
          {warehouseValuation.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {warehouseValuation.map((w) => (
                <div key={w.warehouse_id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Warehouse size={14} className="text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-gray-200">{w.name}</p>
                      <p className="text-xs text-slate-500">{w.code}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-gray-200">{formatCurrency(w.inventory_value)}</span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title={t('lowStock')}>
          {lowStock.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {lowStock.map((row) => (
                <div key={`${row.item_id}-${row.warehouse_id}-${row.variant_id ?? ''}`} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={row.status === 'out_of_stock' ? 'text-red-500' : 'text-amber-500'} />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-gray-200">
                        {row.item_name}{row.variant_name ? ` / ${row.variant_name}` : ''}
                      </p>
                      <p className="text-xs text-slate-500">{row.warehouse_name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.status === 'out_of_stock'
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}
                  >
                    {row.quantity_on_hand} / {row.min_quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title={t('purchaseOrders')}>
          {purchaseOrders.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {purchaseOrders.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <StatusBadge status={row.status} />
                  <div className="text-right">
                    <p className="font-semibold text-slate-700 dark:text-gray-200">{formatCurrency(row.total_value)}</p>
                    <p className="text-xs text-slate-500">{row.order_count} {t('orders')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title={t('goodsReceipts')}>
          {goodsReceipts.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {goodsReceipts.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <StatusBadge status={row.status} />
                  <div className="text-right">
                    <p className="font-semibold text-slate-700 dark:text-gray-200">{formatCurrency(row.total_value)}</p>
                    <p className="text-xs text-slate-500">{row.receipt_count} {t('receipts')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title={t('adjustments')}>
          {adjustments.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {adjustments.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <StatusBadge status={row.status} />
                  <div className="text-right">
                    <p className={`font-semibold ${row.net_value < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(row.net_value)}
                    </p>
                    <p className="text-xs text-slate-500">{row.adjustment_count} {t('adjustmentsCount')} · {row.net_quantity} {t('netQty')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title={t('transfers')}>
          {transfers.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {transfers.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <StatusBadge status={row.status} />
                  <span className="font-semibold text-slate-700 dark:text-gray-200">{row.transfer_count}</span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        <ReportCard title={t('stockCountVariance')}>
          {stockCountsVariance.length === 0 ? (
            <EmptyRow label={t('noData')} />
          ) : (
            <div className="space-y-2">
              {stockCountsVariance.map((row) => (
                <div key={row.stock_count_id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-gray-200">{row.count_number}</p>
                    <p className="text-xs text-slate-500">
                      {row.items_counted} {t('itemsCounted')} · {row.items_with_variance} {t('itemsWithVariance')}
                    </p>
                  </div>
                  <span className={`font-semibold ${row.net_variance_quantity < 0 ? 'text-red-600' : row.net_variance_quantity > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {row.net_variance_quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>
      </div>
    </div>
  );
}

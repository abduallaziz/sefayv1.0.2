'use client';

import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Warehouse,
  Package,
  AlertTriangle,
  XCircle,
  Lock,
  ClipboardList,
  Truck,
  Activity,
  ListChecks,
} from 'lucide-react';
import { useInventoryDashboard } from '../hooks/useInventoryDashboard';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: 'default' | 'warning' | 'danger';
}

function KpiCard({ label, value, icon: Icon, tone = 'default' }: KpiCardProps) {
  const toneClasses =
    tone === 'danger'
      ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
      : tone === 'warning'
        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
        : 'bg-[#E8F1FB] dark:bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]';

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${toneClasses}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

export function InventoryDashboardPage() {
  const t = useTranslations('inventoryDashboard');
  const { data, isLoading } = useInventoryDashboard();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <LayoutDashboard size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        </div>
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      </div>
    );
  }

  const { summary, warehouses, recentMovements, lowStock, purchaseOrdersWaitingReceipt } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
          <LayoutDashboard size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label={t('inventoryValue')} value={formatCurrency(summary.inventory_value)} icon={Package} />
        <KpiCard label={t('totalWarehouses')} value={summary.total_warehouses} icon={Warehouse} />
        <KpiCard label={t('productsInStock')} value={summary.products_in_stock} icon={ListChecks} />
        <KpiCard label={t('lowStockItems')} value={summary.low_stock_items} icon={AlertTriangle} tone="warning" />
        <KpiCard label={t('outOfStockItems')} value={summary.out_of_stock_items} icon={XCircle} tone="danger" />
        <KpiCard label={t('reservedStock')} value={formatCurrency(summary.reserved_stock)} icon={Lock} />
        <KpiCard label={t('pendingPurchaseOrders')} value={summary.pending_purchase_orders} icon={ClipboardList} />
        <KpiCard label={t('pendingGoodsReceipts')} value={summary.pending_goods_receipts} icon={Truck} />
        <KpiCard label={t('movementsToday')} value={summary.movements_today} icon={Activity} />
        <KpiCard label={t('adjustmentsToday')} value={summary.adjustments_today} icon={ListChecks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title={t('recentMovements')}>
          {recentMovements.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-gray-200">
                      {m.items?.name ?? '-'}
                      {m.item_variants?.name ? ` / ${m.item_variants.name}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {m.warehouses?.name ?? '-'} · {m.movement_type} · {formatDate(m.occurred_at)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-gray-200">{m.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('lowStockList')}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((row) => (
                <div key={`${row.item_id}-${row.warehouse_id}-${row.variant_id ?? ''}`} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-gray-200">
                      {row.item_name}{row.variant_name ? ` / ${row.variant_name}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">{row.warehouse_name}</p>
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
        </SectionCard>

        <SectionCard title={t('purchaseOrdersWaitingReceipt')}>
          {purchaseOrdersWaitingReceipt.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {purchaseOrdersWaitingReceipt.map((po) => (
                <div key={po.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-gray-200">{po.order_number}</p>
                    <p className="text-xs text-slate-500">
                      {po.suppliers?.name ?? '-'} · {po.warehouses?.name ?? '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700 dark:text-gray-200">{po.status}</p>
                    <p className="text-xs text-slate-500">{formatDate(po.expected_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('warehouseSummary')}>
          {warehouses.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {warehouses.map((w) => (
                <div key={w.warehouse_id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-gray-200">{w.name}</p>
                    <p className="text-xs text-slate-500">{w.code} · {w.location_count} {t('locations')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700 dark:text-gray-200">{formatCurrency(w.inventory_value)}</p>
                    <p className={`text-xs ${w.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {w.is_active ? t('active') : t('inactive')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

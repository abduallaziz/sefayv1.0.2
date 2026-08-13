'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Wallet, PackageX, PackageMinus, Target, Download,
  LayoutDashboard, ArrowLeftRight, Clock3, PieChart as PieChartIcon,
  Archive, TrendingUp as SlowIcon, Boxes, CheckCircle2, Gauge,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { DateRangePicker, type DateRange } from '@/shared/ui/date-range-picker';
import { formatNumber, formatCurrency } from '@/lib/format';
import { useWarehouses } from '../warehouses/hooks/useWarehouses';
import {
  useValuation, useTurnover, useAging, useAbcAnalysis, useDeadStock,
  useSlowMoving, useOverstock, useStockAccuracy, useCoverage,
} from './hooks/useInventoryAnalytics';
import { exportRowsToCsv } from './utils/exportAnalytics';

type Tab = 'dashboard' | 'valuation' | 'turnover' | 'aging' | 'abc' | 'deadStock' | 'slowMoving' | 'overstock' | 'accuracy' | 'coverage';

function todayMinus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
const TODAY = new Date().toISOString().slice(0, 10);

function fmt(n: number | null | undefined) {
  return formatNumber(n ?? 0);
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('inventoryAnalytics');
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
    >
      <Download className="w-4 h-4" />
      {t('export')}
    </button>
  );
}

function Table({ head, children, colSpan, empty }: { head: React.ReactNode; children: React.ReactNode; colSpan: number; empty: boolean }) {
  const t = useTranslations('inventoryAnalytics');
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">{head}</thead>
        <tbody>
          {children}
          {empty && (
            <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function InventoryAnalyticsPage() {
  const t = useTranslations('inventoryAnalytics');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [range, setRange] = useState<DateRange>({ from: todayMinus(30), to: TODAY });
  const [lookbackDays, setLookbackDays] = useState(90);

  const [nowMs] = useState(() => Date.now());
  const { data: warehouses = [] } = useWarehouses();
  const dateFrom = range.from ?? todayMinus(30);
  const dateTo = range.to ?? TODAY;
  const wh = warehouseId || undefined;

  const valuation = useValuation(wh);
  const turnover = useTurnover(dateFrom, dateTo, wh);
  const aging = useAging(wh);
  const abc = useAbcAnalysis(dateFrom, dateTo, wh);
  const deadStock = useDeadStock(lookbackDays, wh);
  const slowMoving = useSlowMoving(lookbackDays, 5, wh);
  const overstock = useOverstock(wh);
  const accuracy = useStockAccuracy(todayMinus(90), TODAY, wh);
  const coverage = useCoverage(wh);

  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id;

  // Dashboard KPIs
  const totalValuation = useMemo(() => (valuation.data ?? []).reduce((s, r) => s + Number(r.total_value), 0), [valuation.data]);
  const deadStockValue = useMemo(() => (deadStock.data ?? []).reduce((s, r) => s + Number(r.total_value), 0), [deadStock.data]);
  const overstockValue = useMemo(() => (overstock.data ?? []).reduce((s, r) => s + Number(r.excess_value ?? 0), 0), [overstock.data]);
  const slowMovingValue = useMemo(() => {
    const costByKey = new Map((valuation.data ?? []).map((v) => [`${v.item_id}:${v.warehouse_id}`, v.average_unit_cost]));
    return (slowMoving.data ?? []).reduce((s, r) => {
      const cost = costByKey.get(`${r.item_id}:${r.warehouse_id}`) ?? 0;
      return s + r.quantity_on_hand * cost;
    }, 0);
  }, [slowMoving.data, valuation.data]);
  const avgAccuracy = useMemo(() => {
    const rows = (accuracy.data ?? []).filter((r) => r.accuracy_percentage != null);
    if (rows.length === 0) return null;
    return rows.reduce((s, r) => s + Number(r.accuracy_percentage), 0) / rows.length;
  }, [accuracy.data]);

  const abcChartData = useMemo(() => {
    const totals: Record<'A' | 'B' | 'C', number> = { A: 0, B: 0, C: 0 };
    (abc.data ?? []).forEach((r) => { totals[r.classification] += Number(r.cogs_in_period); });
    return (['A', 'B', 'C'] as const).map((k) => ({ name: k, value: totals[k] }));
  }, [abc.data]);
  const ABC_COLORS = { A: '#0C447C', B: '#5B9BD5', C: '#B7D3EC' };

  const agingChartData = useMemo(() => {
    const totals = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    (aging.data ?? []).forEach((r) => {
      totals['0-30'] += Number(r.bucket_0_30);
      totals['31-60'] += Number(r.bucket_31_60);
      totals['61-90'] += Number(r.bucket_61_90);
      totals['90+'] += Number(r.bucket_90_plus);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [aging.data]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('tabs.dashboard'), icon: LayoutDashboard },
    { key: 'valuation', label: t('tabs.valuation'), icon: Wallet },
    { key: 'turnover', label: t('tabs.turnover'), icon: ArrowLeftRight },
    { key: 'aging', label: t('tabs.aging'), icon: Clock3 },
    { key: 'abc', label: t('tabs.abc'), icon: PieChartIcon },
    { key: 'deadStock', label: t('tabs.deadStock'), icon: Archive },
    { key: 'slowMoving', label: t('tabs.slowMoving'), icon: SlowIcon },
    { key: 'overstock', label: t('tabs.overstock'), icon: Boxes },
    { key: 'accuracy', label: t('tabs.accuracy'), icon: CheckCircle2 },
    { key: 'coverage', label: t('tabs.coverage'), icon: Gauge },
  ];

  const showDateRange = tab === 'turnover' || tab === 'abc';
  const showLookback = tab === 'deadStock' || tab === 'slowMoving';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key
                ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab !== 'dashboard' && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent"
          >
            <option value="">{t('allWarehouses')}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          {showDateRange && (
            <DateRangePicker value={range} onChange={setRange} className="!bg-white dark:!bg-gray-900" />
          )}

          {showLookback && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{t('lookbackDays')}</span>
              <input
                type="number"
                min={1}
                value={lookbackDays}
                onChange={(e) => setLookbackDays(Number(e.target.value) || 90)}
                className="w-20 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent"
              />
            </div>
          )}
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label={t('kpi.totalValuation')} value={formatCurrency(totalValuation)} icon={Wallet} />
            <KpiCard label={t('kpi.slowMovingValue')} value={formatCurrency(slowMovingValue)} icon={SlowIcon} />
            <KpiCard label={t('kpi.deadStockValue')} value={formatCurrency(deadStockValue)} icon={PackageX} />
            <KpiCard label={t('kpi.overstockValue')} value={formatCurrency(overstockValue)} icon={PackageMinus} />
            <KpiCard label={t('kpi.stockAccuracy')} value={avgAccuracy != null ? `${formatNumber(avgAccuracy, 1)}%` : '—'} icon={Target} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('charts.abcByValue')}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={abcChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {abcChartData.map((entry) => (
                      <Cell key={entry.name} fill={ABC_COLORS[entry.name as 'A' | 'B' | 'C']} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('charts.agingBuckets')}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agingChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0C447C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'valuation' && (
        valuation.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(valuation.data ?? [], [
              { key: 'item_name', label: 'Item' }, { key: 'warehouse_name', label: 'Warehouse' },
              { key: 'quantity_on_hand', label: 'Quantity' }, { key: 'average_unit_cost', label: 'Unit Cost' }, { key: 'total_value', label: 'Total Value' },
            ], 'inventory-valuation.csv')} /></div>
            <Table
              colSpan={5}
              empty={(valuation.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.warehouse')}</th>
                <th className="text-start px-4 py-3">{t('columns.quantity')}</th>
                <th className="text-start px-4 py-3">{t('columns.unitCost')}</th>
                <th className="text-start px-4 py-3">{t('columns.totalValue')}</th>
              </tr>}
            >
              {(valuation.data ?? []).map((r, i) => (
                <tr key={`${r.item_id}-${r.warehouse_id}-${i}`} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white">{r.item_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.warehouse_name}</td>
                  <td className="px-4 py-3">{fmt(r.quantity_on_hand)}</td>
                  <td className="px-4 py-3">{formatCurrency(r.average_unit_cost)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(r.total_value)}</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}

      {tab === 'turnover' && (
        turnover.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(turnover.data ?? [], [
              { key: 'item_id', label: 'Item ID' }, { key: 'warehouse_id', label: 'Warehouse ID' },
              { key: 'cogs_in_period', label: 'COGS' }, { key: 'average_inventory_value', label: 'Avg Inventory Value' },
              { key: 'turnover_ratio', label: 'Turnover Ratio' }, { key: 'days_in_period', label: 'Days' },
            ], 'inventory-turnover.csv')} /></div>
            <Table
              colSpan={5}
              empty={(turnover.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.warehouse')}</th>
                <th className="text-start px-4 py-3">{t('columns.cogs')}</th>
                <th className="text-start px-4 py-3">{t('columns.avgInventoryValue')}</th>
                <th className="text-start px-4 py-3">{t('columns.turnoverRatio')}</th>
              </tr>}
            >
              {(turnover.data ?? []).map((r, i) => (
                <tr key={`${r.item_id}-${r.warehouse_id}-${i}`} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white font-mono text-xs">{r.item_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-600">{warehouseName(r.warehouse_id)}</td>
                  <td className="px-4 py-3">{formatCurrency(r.cogs_in_period)}</td>
                  <td className="px-4 py-3">{formatCurrency(r.average_inventory_value)}</td>
                  <td className="px-4 py-3 font-semibold">{r.turnover_ratio != null ? fmt(r.turnover_ratio) : '—'}</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}

      {tab === 'aging' && (
        aging.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(aging.data ?? [], [
              { key: 'item_id', label: 'Item ID' }, { key: 'warehouse_id', label: 'Warehouse ID' },
              { key: 'bucket_0_30', label: '0-30 days' }, { key: 'bucket_31_60', label: '31-60 days' },
              { key: 'bucket_61_90', label: '61-90 days' }, { key: 'bucket_90_plus', label: '90+ days' }, { key: 'total_value', label: 'Total Value' },
            ], 'inventory-aging.csv')} /></div>
            <Table
              colSpan={6}
              empty={(aging.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('buckets.0_30')}</th>
                <th className="text-start px-4 py-3">{t('buckets.31_60')}</th>
                <th className="text-start px-4 py-3">{t('buckets.61_90')}</th>
                <th className="text-start px-4 py-3">{t('buckets.90_plus')}</th>
                <th className="text-start px-4 py-3">{t('columns.totalValue')}</th>
              </tr>}
            >
              {(aging.data ?? []).map((r, i) => (
                <tr key={`${r.item_id}-${r.warehouse_id}-${i}`} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white font-mono text-xs">{r.item_id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{fmt(r.bucket_0_30)}</td>
                  <td className="px-4 py-3">{fmt(r.bucket_31_60)}</td>
                  <td className="px-4 py-3">{fmt(r.bucket_61_90)}</td>
                  <td className="px-4 py-3 text-amber-600">{fmt(r.bucket_90_plus)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(r.total_value)}</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}

      {tab === 'abc' && (
        abc.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(abc.data ?? [], [
              { key: 'item_name', label: 'Item' }, { key: 'classification', label: 'Class' },
              { key: 'cogs_in_period', label: 'COGS' }, { key: 'cumulative_percentage', label: 'Cumulative %' },
            ], 'inventory-abc-analysis.csv')} /></div>
            <Table
              colSpan={4}
              empty={(abc.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.classification')}</th>
                <th className="text-start px-4 py-3">{t('columns.valueContribution')}</th>
                <th className="text-start px-4 py-3">{t('columns.cumulativePercentage')}</th>
              </tr>}
            >
              {(abc.data ?? []).map((r) => (
                <tr key={r.item_id} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white">{r.item_name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: ABC_COLORS[r.classification] }}>{r.classification}</span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(r.cogs_in_period)}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(r.cumulative_percentage)}%</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}

      {tab === 'deadStock' && (
        deadStock.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(deadStock.data ?? [], [
              { key: 'item_name', label: 'Item' }, { key: 'quantity_on_hand', label: 'Quantity' },
              { key: 'total_value', label: 'Value' }, { key: 'last_outbound_at', label: 'Last Movement' },
            ], 'inventory-dead-stock.csv')} /></div>
            <Table
              colSpan={4}
              empty={(deadStock.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.quantity')}</th>
                <th className="text-start px-4 py-3">{t('columns.daysWithoutMovement')}</th>
                <th className="text-start px-4 py-3">{t('columns.totalValue')}</th>
              </tr>}
            >
              {(deadStock.data ?? []).map((r) => {
                const days = r.last_outbound_at
                  ? Math.floor((nowMs - new Date(r.last_outbound_at).getTime()) / 86400000)
                  : null;
                return (
                  <tr key={`${r.item_id}-${r.warehouse_id}`} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{r.item_name}</td>
                    <td className="px-4 py-3">{fmt(r.quantity_on_hand)}</td>
                    <td className="px-4 py-3 text-amber-600">{days != null ? `${days} ${t('days')}` : t('never')}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(r.total_value)}</td>
                  </tr>
                );
              })}
            </Table>
          </>
        )
      )}

      {tab === 'slowMoving' && (
        slowMoving.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(slowMoving.data ?? [], [
              { key: 'item_name', label: 'Item' }, { key: 'quantity_on_hand', label: 'Quantity' },
              { key: 'units_sold_in_window', label: 'Units Sold' }, { key: 'turnover_ratio', label: 'Turnover Ratio' },
            ], 'inventory-slow-moving.csv')} /></div>
            <Table
              colSpan={4}
              empty={(slowMoving.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.quantity')}</th>
                <th className="text-start px-4 py-3">{t('columns.unitsSold')}</th>
                <th className="text-start px-4 py-3">{t('columns.movementRate')}</th>
              </tr>}
            >
              {(slowMoving.data ?? []).map((r) => (
                <tr key={`${r.item_id}-${r.warehouse_id}`} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white">{r.item_name}</td>
                  <td className="px-4 py-3">{fmt(r.quantity_on_hand)}</td>
                  <td className="px-4 py-3">{fmt(r.units_sold_in_window)}</td>
                  <td className="px-4 py-3 font-semibold">{r.turnover_ratio != null ? fmt(r.turnover_ratio) : '—'}</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}

      {tab === 'overstock' && (
        overstock.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(overstock.data ?? [], [
              { key: 'item_name', label: 'Item' }, { key: 'quantity_on_hand', label: 'On Hand' },
              { key: 'max_quantity', label: 'Max' }, { key: 'excess_quantity', label: 'Excess Qty' }, { key: 'excess_value', label: 'Excess Value' },
            ], 'inventory-overstock.csv')} /></div>
            <Table
              colSpan={4}
              empty={(overstock.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.quantity')}</th>
                <th className="text-start px-4 py-3">{t('columns.excessQuantity')}</th>
                <th className="text-start px-4 py-3">{t('columns.excessValue')}</th>
              </tr>}
            >
              {(overstock.data ?? [])
                .filter((r) => r.has_reorder_point && Number(r.excess_quantity) > 0)
                .map((r) => (
                  <tr key={`${r.item_id}-${r.warehouse_id}`} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{r.item_name}</td>
                    <td className="px-4 py-3">{fmt(r.quantity_on_hand)}</td>
                    <td className="px-4 py-3 text-amber-600">{fmt(r.excess_quantity)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(r.excess_value ?? 0)}</td>
                  </tr>
                ))}
            </Table>
          </>
        )
      )}

      {tab === 'accuracy' && (
        accuracy.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(accuracy.data ?? [], [
              { key: 'warehouse_id', label: 'Warehouse ID' }, { key: 'total_expected_quantity', label: 'Expected' },
              { key: 'total_absolute_variance_quantity', label: 'Variance' }, { key: 'accuracy_percentage', label: 'Accuracy %' },
            ], 'inventory-stock-accuracy.csv')} /></div>
            <Table
              colSpan={4}
              empty={(accuracy.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.warehouse')}</th>
                <th className="text-start px-4 py-3">{t('columns.expectedQuantity')}</th>
                <th className="text-start px-4 py-3">{t('columns.variance')}</th>
                <th className="text-start px-4 py-3">{t('columns.accuracy')}</th>
              </tr>}
            >
              {(accuracy.data ?? []).map((r) => (
                <tr key={r.warehouse_id} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white">{warehouseName(r.warehouse_id)}</td>
                  <td className="px-4 py-3">{fmt(r.total_expected_quantity)}</td>
                  <td className="px-4 py-3 text-amber-600">{fmt(r.total_absolute_variance_quantity)}</td>
                  <td className="px-4 py-3 font-semibold">{r.accuracy_percentage != null ? `${fmt(r.accuracy_percentage)}%` : '—'}</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}

      {tab === 'coverage' && (
        coverage.isLoading ? <TableSkeleton /> : (
          <>
            <div className="flex justify-end"><ExportButton onClick={() => exportRowsToCsv(coverage.data ?? [], [
              { key: 'item_name', label: 'Item' }, { key: 'quantity_on_hand', label: 'Available' },
              { key: 'average_daily_demand', label: 'Avg Daily Demand' }, { key: 'days_of_coverage', label: 'Coverage Days' },
            ], 'inventory-coverage.csv')} /></div>
            <Table
              colSpan={4}
              empty={(coverage.data ?? []).length === 0}
              head={<tr>
                <th className="text-start px-4 py-3">{t('columns.item')}</th>
                <th className="text-start px-4 py-3">{t('columns.available')}</th>
                <th className="text-start px-4 py-3">{t('columns.avgDailyDemand')}</th>
                <th className="text-start px-4 py-3">{t('columns.coverageDays')}</th>
              </tr>}
            >
              {(coverage.data ?? []).map((r) => (
                <tr key={`${r.item_id}-${r.warehouse_id}`} className="border-t border-slate-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-slate-800 dark:text-white">{r.item_name}</td>
                  <td className="px-4 py-3">{fmt(r.quantity_on_hand)}</td>
                  <td className="px-4 py-3">{fmt(r.average_daily_demand)}</td>
                  <td className="px-4 py-3 font-semibold">{r.days_of_coverage != null ? `${fmt(r.days_of_coverage)} ${t('days')}` : '—'}</td>
                </tr>
              ))}
            </Table>
          </>
        )
      )}
    </div>
  );
}

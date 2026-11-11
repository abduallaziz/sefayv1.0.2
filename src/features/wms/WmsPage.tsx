'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, PackagePlus, ListTodo, ScanLine, PackageCheck, Truck, Waves,
} from 'lucide-react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { usePermission } from '@/core/permissions/hooks/usePermission';
import { useWarehouses } from '../warehouses/hooks/useWarehouses';
import { useItems } from '../items/hooks/useItems';
import {
  useShipments, usePutawayRules, useReplenishmentRules,
  useConfirmPack, useShipShipment, useRunReplenishmentCheck,
} from './hooks/useWms';
import { WmsOverviewDashboard } from './components/WmsOverviewDashboard';
import { PickListsList } from './components/PickListsList';
import { WavesList } from './components/WavesList';
import { WarehouseTasksList } from './components/WarehouseTasksList';

type Tab = 'dashboard' | 'putaway' | 'tasks' | 'waves' | 'picking' | 'packing' | 'shipping';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600', assigned: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', open: 'bg-slate-100 text-slate-600',
    picking: 'bg-amber-100 text-amber-700', picked: 'bg-blue-100 text-blue-700', packing: 'bg-amber-100 text-amber-700',
    packed: 'bg-blue-100 text-blue-700', shipped: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

export function WmsPage() {
  const t = useTranslations('wms');
  const [tab, setTab] = useState<Tab>('dashboard');
  const canManage = usePermission('warehouse.manage');
  const canFulfill = usePermission('inventory.fulfill');

  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const [warehouseId, setWarehouseId] = useState('');

  const shipments = useShipments();
  const putawayRules = usePutawayRules();
  const replenishmentRules = useReplenishmentRules();

  const confirmPack = useConfirmPack();
  const shipShipment = useShipShipment();
  const runReplenishment = useRunReplenishmentCheck();

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('tabs.dashboard'), icon: LayoutDashboard },
    { key: 'putaway', label: t('tabs.putaway'), icon: PackagePlus },
    { key: 'tasks', label: t('tabs.tasks'), icon: ListTodo },
    { key: 'waves', label: t('tabs.waves'), icon: Waves },
    { key: 'picking', label: t('tabs.picking'), icon: ScanLine },
    { key: 'packing', label: t('tabs.packing'), icon: PackageCheck },
    { key: 'shipping', label: t('tabs.shipping'), icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <WmsOverviewDashboard />}

      {tab === 'putaway' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('putawayRules')}</h3>
            {putawayRules.isLoading ? <TableSkeleton /> : (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                    <tr><th className="text-start px-4 py-3">{t('columns.name')}</th><th className="text-start px-4 py-3">{t('columns.item')}</th><th className="text-start px-4 py-3">{t('columns.priority')}</th></tr>
                  </thead>
                  <tbody>
                    {(putawayRules.data ?? []).map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-gray-800">
                        <td className="px-4 py-3 text-slate-800 dark:text-white">{r.name}</td>
                        <td className="px-4 py-3">{r.applies_to_item_id ? itemName(r.applies_to_item_id) : t('anyItem')}</td>
                        <td className="px-4 py-3">{r.priority}</td>
                      </tr>
                    ))}
                    {(putawayRules.data ?? []).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('replenishmentRules')}</h3>
              {canManage && (
                <div className="flex items-center gap-2">
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent">
                    <option value="">{t('selectWarehouse')}</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <button
                    disabled={!warehouseId || runReplenishment.isPending}
                    onClick={() => runReplenishment.mutate(warehouseId)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                  >
                    {t('runReplenishmentCheck')}
                  </button>
                </div>
              )}
            </div>
            {replenishmentRules.isLoading ? <TableSkeleton /> : (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                    <tr><th className="text-start px-4 py-3">{t('columns.item')}</th><th className="text-start px-4 py-3">{t('columns.min')}</th><th className="text-start px-4 py-3">{t('columns.max')}</th></tr>
                  </thead>
                  <tbody>
                    {(replenishmentRules.data ?? []).map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-gray-800">
                        <td className="px-4 py-3 text-slate-800 dark:text-white">{itemName(r.item_id)}</td>
                        <td className="px-4 py-3">{r.min_quantity}</td>
                        <td className="px-4 py-3">{r.max_quantity}</td>
                      </tr>
                    ))}
                    {(replenishmentRules.data ?? []).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory #7 / F11 (Owner-approved) — Warehouse Task Management UI.
          Supersedes the previous ad-hoc, unbounded, two-call tab above —
          which also had a broken assign button (called mutate with
          assignedTo: '', an empty UUID fn_assign_warehouse_task would
          reject) and a confirm button gated on confirmed_location_id, a
          field never set before a task's first confirm, making it
          unreachable. See WarehouseTaskDetailDrawer for the real fix. */}
      {tab === 'tasks' && <WarehouseTasksList />}

      {/* Inventory #7 / F2 (Owner-approved) — Pick Lists List + Filters.
          Supersedes the previous ad-hoc card list, which fetched every pick
          list unbounded and embedded a line-level "Confirm Pick" action —
          that inline fulfillment affordance belonged to Pick List Detail
          (a later item, explicitly out of F2 scope), not a list view, so it
          is not carried forward here. */}
      {tab === 'waves' && <WavesList />}

      {tab === 'picking' && <PickListsList />}

      {tab === 'packing' && (
        shipments.isLoading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr><th className="text-start px-4 py-3">{t('columns.item')}</th><th className="text-start px-4 py-3">{t('columns.quantity')}</th><th className="text-start px-4 py-3">{t('columns.status')}</th>{canFulfill && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}</tr>
              </thead>
              <tbody>
                {(shipments.data ?? []).filter((s) => s.status === 'picked' || s.status === 'packing').flatMap((s) => (s.lines ?? []).map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{line.items?.name ?? itemName(line.item_id)}</td>
                    <td className="px-4 py-3">{line.quantity_packed}/{line.quantity_picked}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    {canFulfill && line.quantity_packed < line.quantity_picked && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => confirmPack.mutate({ lineId: line.id, quantity: line.quantity_picked - line.quantity_packed })}
                          className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          {t('actions.confirmPack')}
                        </button>
                      </td>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'shipping' && (
        shipments.isLoading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr><th className="text-start px-4 py-3">{t('columns.reference')}</th><th className="text-start px-4 py-3">{t('columns.status')}</th><th className="text-start px-4 py-3">{t('columns.tracking')}</th>{canFulfill && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}</tr>
              </thead>
              <tbody>
                {(shipments.data ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{s.reference_type} — {s.reference_id.slice(0, 8)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">{s.tracking_number ?? '—'}</td>
                    {canFulfill && s.status === 'packed' && (
                      <td className="px-4 py-3">
                        <button onClick={() => shipShipment.mutate({ id: s.id })} className="text-xs px-2 py-1 rounded bg-[#0C447C] text-white hover:bg-[#0a3a6b]">{t('actions.ship')}</button>
                      </td>
                    )}
                  </tr>
                ))}
                {(shipments.data ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

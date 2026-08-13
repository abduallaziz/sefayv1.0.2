'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, PackagePlus, ListTodo, ScanLine, PackageCheck, Truck,
} from 'lucide-react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { usePermission } from '@/core/permissions/hooks/usePermission';
import { useWarehouses } from '../warehouses/hooks/useWarehouses';
import { useItems } from '../items/hooks/useItems';
import {
  useShipments, usePickLists, usePutawayRules, useReplenishmentRules, useWarehouseTasks,
  useConfirmPack, useShipShipment, useConfirmPick, useRunReplenishmentCheck,
  useAssignWarehouseTask, useConfirmWarehouseTask, useCancelWarehouseTask,
} from './hooks/useWms';

type Tab = 'dashboard' | 'putaway' | 'tasks' | 'picking' | 'packing' | 'shipping';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600', assigned: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', open: 'bg-slate-100 text-slate-600',
    picking: 'bg-amber-100 text-amber-700', picked: 'bg-blue-100 text-blue-700', packing: 'bg-amber-100 text-amber-700',
    packed: 'bg-blue-100 text-blue-700', shipped: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
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

export function WmsPage() {
  const t = useTranslations('wms');
  const [tab, setTab] = useState<Tab>('dashboard');
  const canManage = usePermission('warehouse.manage');
  const canApprove = usePermission('warehouse.approve');
  const canFulfill = usePermission('inventory.fulfill');

  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const [warehouseId, setWarehouseId] = useState('');

  const shipments = useShipments();
  const pickLists = usePickLists();
  const putawayRules = usePutawayRules();
  const replenishmentRules = useReplenishmentRules();
  const putawayTasks = useWarehouseTasks('putaway');
  const replenishmentTasks = useWarehouseTasks('replenishment');

  const confirmPack = useConfirmPack();
  const shipShipment = useShipShipment();
  const confirmPick = useConfirmPick();
  const runReplenishment = useRunReplenishmentCheck();
  const assignTask = useAssignWarehouseTask();
  const confirmTask = useConfirmWarehouseTask();
  const cancelTask = useCancelWarehouseTask();

  const pendingPutaway = useMemo(() => (putawayTasks.data ?? []).filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length, [putawayTasks.data]);
  const pendingReplenishment = useMemo(() => (replenishmentTasks.data ?? []).filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length, [replenishmentTasks.data]);
  const activePickLists = useMemo(() => (pickLists.data ?? []).filter((p) => p.status === 'open' || p.status === 'in_progress').length, [pickLists.data]);
  const readyToShip = useMemo(() => (shipments.data ?? []).filter((s) => s.status === 'packed').length, [shipments.data]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('tabs.dashboard'), icon: LayoutDashboard },
    { key: 'putaway', label: t('tabs.putaway'), icon: PackagePlus },
    { key: 'tasks', label: t('tabs.tasks'), icon: ListTodo },
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

      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label={t('kpi.pendingPutaway')} value={String(pendingPutaway)} icon={PackagePlus} />
          <KpiCard label={t('kpi.pendingReplenishment')} value={String(pendingReplenishment)} icon={ListTodo} />
          <KpiCard label={t('kpi.activePickLists')} value={String(activePickLists)} icon={ScanLine} />
          <KpiCard label={t('kpi.readyToShip')} value={String(readyToShip)} icon={Truck} />
        </div>
      )}

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

      {tab === 'tasks' && (
        (putawayTasks.isLoading || replenishmentTasks.isLoading) ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.type')}</th>
                  <th className="text-start px-4 py-3">{t('columns.item')}</th>
                  <th className="text-start px-4 py-3">{t('columns.quantity')}</th>
                  <th className="text-start px-4 py-3">{t('columns.status')}</th>
                  {(canManage || canApprove) && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {[...(putawayTasks.data ?? []), ...(replenishmentTasks.data ?? [])].map((task) => (
                  <tr key={task.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white capitalize">{task.task_type}</td>
                    <td className="px-4 py-3">{task.items?.name ?? itemName(task.item_id)}</td>
                    <td className="px-4 py-3">{task.quantity_completed}/{task.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    {(canManage || canApprove) && (
                      <td className="px-4 py-3 flex gap-2">
                        {task.status === 'pending' && canManage && (
                          <button onClick={() => assignTask.mutate({ id: task.id, assignedTo: '' })} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">{t('actions.assign')}</button>
                        )}
                        {(task.status === 'assigned' || task.status === 'in_progress') && canApprove && task.confirmed_location_id && (
                          <button
                            onClick={() => confirmTask.mutate({ id: task.id, quantity: task.quantity - task.quantity_completed, locationId: task.suggested_location_id ?? task.confirmed_location_id! })}
                            className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            {t('actions.confirm')}
                          </button>
                        )}
                        {task.status !== 'completed' && task.status !== 'cancelled' && canManage && (
                          <button onClick={() => cancelTask.mutate(task.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">{t('actions.cancel')}</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {(putawayTasks.data ?? []).length === 0 && (replenishmentTasks.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'picking' && (
        pickLists.isLoading ? <TableSkeleton /> : (
          <div className="space-y-3">
            {(pickLists.data ?? []).map((pl) => (
              <div key={pl.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{pl.strategy} {t('tabs.picking')}</span>
                    <StatusBadge status={pl.status} />
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr><th className="text-start py-1">{t('columns.item')}</th><th className="text-start py-1">{t('columns.quantity')}</th>{canFulfill && <th className="text-start py-1">{t('columns.actions')}</th>}</tr>
                  </thead>
                  <tbody>
                    {(pl.lines ?? []).map((line) => (
                      <tr key={line.id} className="border-t border-slate-100 dark:border-gray-800">
                        <td className="py-2 text-slate-800 dark:text-white">{line.items?.name ?? itemName(line.item_id)}</td>
                        <td className="py-2">{line.quantity_picked}/{line.quantity_to_pick}</td>
                        {canFulfill && line.quantity_picked < line.quantity_to_pick && (
                          <td className="py-2">
                            <button
                              onClick={() => confirmPick.mutate({ lineId: line.id, quantity: line.quantity_to_pick - line.quantity_picked })}
                              className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              {t('actions.confirmPick')}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {(pickLists.data ?? []).length === 0 && <p className="text-center text-slate-400 py-8">{t('noData')}</p>}
          </div>
        )
      )}

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

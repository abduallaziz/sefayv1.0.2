'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ListChecks, Plus, ShoppingCart, Trash2, Pencil } from 'lucide-react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { usePermission } from '@/core/permissions/hooks/usePermission';
import { useWarehouses } from '../warehouses/hooks/useWarehouses';
import { useItems } from '../items/hooks/useItems';
import {
  useReorderPoints,
  useBelowMinimum,
  usePurchaseSuggestions,
  useCreateReorderPoint,
  useUpdateReorderPoint,
  useDeleteReorderPoint,
  useConvertSuggestionsToRequest,
} from './hooks/usePlanning';
import { CreateReorderPointDTO, PurchaseSuggestion, ReorderPoint } from './types/planning.types';

type Tab = 'rules' | 'lowStock' | 'suggestions';

function fmt(n: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n ?? 0);
}

export function PlanningPage() {
  const t = useTranslations('planning');
  const canManage = usePermission('inventory.manage');
  const canManagePurchasing = usePermission('purchasing.manage');
  const [tab, setTab] = useState<Tab>('rules');

  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();

  const { data: reorderPoints = [], isLoading: loadingRules } = useReorderPoints();
  const { data: lowStock = [], isLoading: loadingLowStock } = useBelowMinimum();
  const { data: suggestions = [], isLoading: loadingSuggestions } = usePurchaseSuggestions();

  const createRP = useCreateReorderPoint();
  const updateRP = useUpdateReorderPoint();
  const deleteRP = useDeleteReorderPoint();
  const convert = useConvertSuggestionsToRequest();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReorderPoint | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id;

  const selectedSuggestions = useMemo(
    () => suggestions.filter((s) => selected[s.reorder_point_id]),
    [suggestions, selected],
  );

  const handleConvert = () => {
    if (selectedSuggestions.length === 0) return;
    const warehouseId = selectedSuggestions[0].warehouse_id;
    convert.mutate(
      {
        warehouse_id: warehouseId,
        notes: t('generatedFromSuggestions'),
        items: selectedSuggestions.map((s) => ({
          item_id: s.item_id,
          variant_id: s.variant_id ?? undefined,
          quantity_requested: s.suggested_order_quantity,
        })),
      },
      { onSuccess: () => setSelected({}) },
    );
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'rules', label: t('tabs.rules'), icon: ListChecks, count: reorderPoints.length },
    { key: 'lowStock', label: t('tabs.lowStock'), icon: AlertTriangle, count: lowStock.length },
    { key: 'suggestions', label: t('tabs.suggestions'), icon: ShoppingCart, count: suggestions.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        {tab === 'rules' && canManage && (
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addRule')}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-gray-800">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="text-xs bg-slate-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5">{count}</span>
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        loadingRules ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.item')}</th>
                  <th className="text-start px-4 py-3">{t('columns.warehouse')}</th>
                  <th className="text-start px-4 py-3">{t('columns.min')}</th>
                  <th className="text-start px-4 py-3">{t('columns.max')}</th>
                  <th className="text-start px-4 py-3">{t('columns.reorderQty')}</th>
                  <th className="text-start px-4 py-3">{t('columns.leadTime')}</th>
                  {canManage && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {reorderPoints.map((rp) => (
                  <tr key={rp.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{rp.items?.name ?? itemName(rp.item_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{rp.warehouses?.name ?? warehouseName(rp.warehouse_id)}</td>
                    <td className="px-4 py-3">{fmt(rp.min_quantity)}</td>
                    <td className="px-4 py-3">{rp.max_quantity != null ? fmt(rp.max_quantity) : '—'}</td>
                    <td className="px-4 py-3">{fmt(rp.reorder_quantity)}</td>
                    <td className="px-4 py-3">{rp.lead_time_days != null ? `${fmt(rp.lead_time_days)} ${t('days')}` : '—'}</td>
                    {canManage && (
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => { setEditing(rp); setFormOpen(true); }} className="text-slate-500 hover:text-[#0C447C]">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteRP.mutate(rp.id)} className="text-slate-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {reorderPoints.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">{t('empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'lowStock' && (
        loadingLowStock ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.item')}</th>
                  <th className="text-start px-4 py-3">{t('columns.warehouse')}</th>
                  <th className="text-start px-4 py-3">{t('columns.min')}</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((rp) => (
                  <tr key={rp.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 flex items-center gap-2 text-slate-800 dark:text-white">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {rp.items?.name ?? itemName(rp.item_id)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{rp.warehouses?.name ?? warehouseName(rp.warehouse_id)}</td>
                    <td className="px-4 py-3">{fmt(rp.min_quantity)}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">{t('noShortages')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'suggestions' && (
        loadingSuggestions ? <TableSkeleton /> : (
          <div className="space-y-3">
            {canManagePurchasing && (
              <div className="flex justify-end">
                <button
                  disabled={selectedSuggestions.length === 0 || convert.isPending}
                  onClick={handleConvert}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('convertToRequest')} ({selectedSuggestions.length})
                </button>
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                  <tr>
                    {canManagePurchasing && <th className="px-4 py-3"></th>}
                    <th className="text-start px-4 py-3">{t('columns.item')}</th>
                    <th className="text-start px-4 py-3">{t('columns.available')}</th>
                    <th className="text-start px-4 py-3">{t('columns.incoming')}</th>
                    <th className="text-start px-4 py-3">{t('columns.avgDailyDemand')}</th>
                    <th className="text-start px-4 py-3">{t('columns.leadTime')}</th>
                    <th className="text-start px-4 py-3">{t('columns.suggestedQty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s: PurchaseSuggestion) => (
                    <tr key={s.reorder_point_id} className="border-t border-slate-100 dark:border-gray-800">
                      {canManagePurchasing && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={!!selected[s.reorder_point_id]}
                            onChange={(e) =>
                              setSelected((prev) => ({ ...prev, [s.reorder_point_id]: e.target.checked }))
                            }
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-800 dark:text-white">{s.item_name}</td>
                      <td className="px-4 py-3">{fmt(s.quantity_available)}</td>
                      <td className="px-4 py-3">{fmt(s.quantity_incoming)}</td>
                      <td className="px-4 py-3">{fmt(s.avg_daily_demand)}</td>
                      <td className="px-4 py-3">{fmt(s.lead_time_days)} {t('days')}</td>
                      <td className="px-4 py-3 font-semibold text-[#0C447C] dark:text-[#5B9BD5]">
                        {fmt(s.suggested_order_quantity)}
                      </td>
                    </tr>
                  ))}
                  {suggestions.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">{t('noSuggestions')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {formOpen && (
        <ReorderRuleModal
          warehouses={warehouses}
          items={items}
          editing={editing}
          isLoading={createRP.isPending || updateRP.isPending}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={(dto) => {
            if (editing) {
              updateRP.mutate({ id: editing.id, dto }, { onSuccess: () => { setFormOpen(false); setEditing(null); } });
            } else {
              createRP.mutate(dto, { onSuccess: () => setFormOpen(false) });
            }
          }}
        />
      )}
    </div>
  );
}

function ReorderRuleModal({
  warehouses,
  items,
  editing,
  isLoading,
  onClose,
  onSubmit,
}: {
  warehouses: { id: string; name: string }[];
  items: { id: string; name: string }[];
  editing: ReorderPoint | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateReorderPointDTO) => void;
}) {
  const t = useTranslations('planning');
  const [form, setForm] = useState<CreateReorderPointDTO>({
    warehouse_id: editing?.warehouse_id ?? '',
    item_id: editing?.item_id ?? '',
    min_quantity: editing?.min_quantity ?? 0,
    max_quantity: editing?.max_quantity ?? undefined,
    reorder_quantity: editing?.reorder_quantity ?? 0,
    lead_time_days: editing?.lead_time_days ?? undefined,
    service_level_z: editing?.service_level_z ?? undefined,
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          {editing ? t('editRule') : t('addRule')}
        </h2>

        <div className="space-y-4">
          {!editing && (
            <>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('columns.warehouse')}</label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                  value={form.warehouse_id}
                  onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                >
                  <option value="">{t('selectWarehouse')}</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('columns.item')}</label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                  value={form.item_id}
                  onChange={(e) => setForm((f) => ({ ...f, item_id: e.target.value }))}
                >
                  <option value="">{t('selectItem')}</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('columns.min')}</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={form.min_quantity}
              onChange={(e) => setForm((f) => ({ ...f, min_quantity: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('columns.max')}</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={form.max_quantity ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, max_quantity: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('columns.reorderQty')}</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={form.reorder_quantity}
              onChange={(e) => setForm((f) => ({ ...f, reorder_quantity: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('columns.leadTime')}</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={form.lead_time_days ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, lead_time_days: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('serviceLevelZ')}</label>
            <input
              type="number"
              step="0.01"
              placeholder="1.65"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={form.service_level_z ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, service_level_z: e.target.value ? Number(e.target.value) : undefined }))}
            />
            <p className="text-xs text-slate-400 mt-1">{t('serviceLevelHint')}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            {t('cancel')}
          </button>
          <button
            disabled={isLoading || !form.warehouse_id || !form.item_id}
            onClick={() => onSubmit(form)}
            className="px-4 py-2 text-sm bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-40 text-white rounded-lg"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

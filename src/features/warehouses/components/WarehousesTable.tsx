'use client';

import { useTranslations } from 'next-intl';
import { Edit, Trash2, ToggleLeft, ToggleRight, Warehouse as WarehouseIcon, Plus } from 'lucide-react';
import { Warehouse } from '../types/warehouse.types';
import { EmptyState } from '@/shared/ui/empty-state';

interface Props {
  warehouses: Warehouse[];
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onToggleActive: (warehouse: Warehouse) => void;
  onCreate?: () => void;
}

export function WarehousesTable({ warehouses, onEdit, onDelete, onToggleActive, onCreate }: Props) {
  const t = useTranslations('warehouses');

  if (warehouses.length === 0) {
    return (
      <EmptyState
        theme="inventory"
        icon={WarehouseIcon}
        title={t('noWarehouses')}
        description={t('noWarehousesHint')}
        action={
          onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('addWarehouse')}
            </button>
          )
        }
      />
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{warehouse.name}</p>
                <p className="text-xs text-slate-500 truncate">{warehouse.code}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(warehouse)} aria-label={t('editWarehouse')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C]">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(warehouse)} aria-label={t('deleteWarehouse')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-gray-800">
              <span className="text-xs text-slate-500">{warehouse.address ?? '—'}</span>
              <button
                onClick={() => onToggleActive(warehouse)}
                className={`flex items-center gap-1 text-xs font-medium ${
                  warehouse.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                {warehouse.is_active
                  ? <><ToggleRight className="w-4 h-4" />{t('active')}</>
                  : <><ToggleLeft className="w-4 h-4" />{t('inactive')}</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('code')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('name')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('address')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-20">{t('status')}</th>
              <th className="px-3 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {warehouses.map((warehouse, i) => (
              <tr key={warehouse.id} className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}>
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{warehouse.code}</td>
                <td className="px-3 py-3 text-slate-800 dark:text-white max-w-[160px] truncate">{warehouse.name}</td>
                <td className="px-3 py-3 text-slate-500 max-w-[200px] truncate">{warehouse.address ?? '—'}</td>
                <td className="px-3 py-3 w-20">
                  <button
                    onClick={() => onToggleActive(warehouse)}
                    className={`flex items-center gap-1 text-xs font-medium ${
                      warehouse.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {warehouse.is_active
                      ? <><ToggleRight className="w-4 h-4" /><span>{t('active')}</span></>
                      : <><ToggleLeft className="w-4 h-4" /><span>{t('inactive')}</span></>
                    }
                  </button>
                </td>
                <td className="px-3 py-3 w-16">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(warehouse)}
                      aria-label={t('editWarehouse')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(warehouse)}
                      aria-label={t('deleteWarehouse')}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

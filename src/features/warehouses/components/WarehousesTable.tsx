'use client';

import { useTranslations } from 'next-intl';
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Warehouse } from '../types/warehouse.types';

interface Props {
  warehouses: Warehouse[];
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onToggleActive: (warehouse: Warehouse) => void;
}

export function WarehousesTable({ warehouses, onEdit, onDelete, onToggleActive }: Props) {
  const t = useTranslations('warehouses');

  if (warehouses.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noWarehouses')}</p>
      </div>
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
                <button onClick={() => onEdit(warehouse)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(warehouse)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
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
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('code')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('name')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('address')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-20">{t('status')}</th>
              <th className="px-3 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {warehouses.map((warehouse) => (
              <tr key={warehouse.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
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
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(warehouse)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useWarehouses } from '../hooks/useInventory';
import { Warehouse } from '../types/inventory.types';
import { WarehouseFormModal } from './WarehouseFormModal';

export function WarehousesSection() {
  const t = useTranslations('inventory');
  const { data: warehouses = [], isLoading } = useWarehouses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('warehouses.addWarehouse')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('warehouses.noWarehouses')}</div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">{t('warehouses.noWarehouses')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouses.name')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouses.isDefault')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouses.status')}</th>
                <th className="px-3 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {warehouses.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{w.name}</td>
                  <td className="px-3 py-3">
                    {w.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]">
                        {t('warehouses.isDefault')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      w.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {w.is_active ? t('warehouses.active') : t('warehouses.inactive')}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-16">
                    <button
                      onClick={() => { setEditing(w); setModalOpen(true); }}
                      className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline"
                    >
                      {t('warehouses.editWarehouse')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <WarehouseFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />
    </div>
  );
}

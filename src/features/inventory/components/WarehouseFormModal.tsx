'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useCreateWarehouse, useUpdateWarehouse } from '../hooks/useInventory';
import { Warehouse } from '../types/inventory.types';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Warehouse | null;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function WarehouseFormModal({ open, onClose, editing }: Props) {
  const t = useTranslations('inventory');
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setIsDefault(editing?.is_default ?? false);
    setIsActive(editing?.is_active ?? true);
  }, [open, editing]);

  if (!open) return null;

  const isPending = createWarehouse.isPending || updateWarehouse.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      updateWarehouse.mutate(
        { id: editing.id, data: { name, is_default: isDefault, is_active: isActive } },
        { onSuccess: onClose }
      );
    } else {
      createWarehouse.mutate({ name, is_default: isDefault }, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {editing ? t('warehouses.editWarehouse') : t('warehouses.addWarehouse')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('warehouses.name')}</label>
            <input
              type="text"
              placeholder={t('warehouses.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-[#0C447C]"
            />
            {t('warehouses.isDefault')}
          </label>

          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#0C447C]"
              />
              {t('warehouses.active')}
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isPending ? t('warehouses.saving') : t('warehouses.save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
              {t('warehouses.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

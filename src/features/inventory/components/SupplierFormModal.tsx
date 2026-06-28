'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useInventory';
import { Supplier } from '../types/inventory.types';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Supplier | null;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function SupplierFormModal({ open, onClose, editing }: Props) {
  const t = useTranslations('inventory');
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setPhone(editing?.phone ?? '');
    setEmail(editing?.email ?? '');
    setAddress(editing?.address ?? '');
    setIsActive(editing?.is_active ?? true);
  }, [open, editing]);

  if (!open) return null;

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
    };

    if (editing) {
      updateSupplier.mutate({ id: editing.id, data: { ...data, is_active: isActive } }, { onSuccess: onClose });
    } else {
      createSupplier.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {editing ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('suppliers.name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('suppliers.phone')}</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('suppliers.email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('suppliers.address')}</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#0C447C]"
              />
              {t('suppliers.active')}
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isPending ? t('suppliers.saving') : t('suppliers.save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
              {t('suppliers.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

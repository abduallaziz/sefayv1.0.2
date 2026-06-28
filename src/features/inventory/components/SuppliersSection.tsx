'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useSuppliers } from '../hooks/useInventory';
import { Supplier } from '../types/inventory.types';
import { SupplierFormModal } from './SupplierFormModal';

export function SuppliersSection() {
  const t = useTranslations('inventory');
  const { data: suppliers = [], isLoading } = useSuppliers();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  }, [suppliers, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          type="text"
          placeholder={t('suppliers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] text-slate-800 dark:text-white placeholder-slate-400"
        />
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('suppliers.addSupplier')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('suppliers.noSuppliers')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">{t('suppliers.noSuppliers')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('suppliers.name')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('suppliers.phone')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('suppliers.email')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('suppliers.address')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('suppliers.status')}</th>
                <th className="px-3 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{s.name}</td>
                  <td className="px-3 py-3 text-slate-500">{s.phone ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{s.email ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-500 max-w-[200px] truncate">{s.address ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {s.is_active ? t('suppliers.active') : t('suppliers.inactive')}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-16">
                    <button
                      onClick={() => { setEditing(s); setModalOpen(true); }}
                      className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline"
                    >
                      {t('suppliers.editSupplier')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SupplierFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />
    </div>
  );
}

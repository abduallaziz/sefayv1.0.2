'use client';

import { useState, useMemo } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from './hooks/useSuppliers';
import { SupplierFiltersBar } from './components/SupplierFilters';
import { SuppliersTable } from './components/SuppliersTable';
import { SupplierFormModal } from './components/SupplierFormModal';
import { DeleteSupplierModal } from './components/DeleteSupplierModal';
import { Supplier, SupplierFilters, CreateSupplierDTO } from './types/supplier.types';

export function SuppliersPage() {
  const t = useTranslations('suppliers');
  const { data: suppliers = [], isLoading } = useSuppliers();

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    is_active: 'all',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    return suppliers.filter((supplier) => {
      if (filters.search && !supplier.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.is_active !== 'all' && supplier.is_active !== filters.is_active) return false;
      return true;
    });
  }, [suppliers, filters]);

  const handleSubmit = (data: CreateSupplierDTO) => {
    if (selectedSupplier) {
      updateSupplier.mutate(
        { id: selectedSupplier.id, data },
        { onSuccess: () => { setFormOpen(false); setSelectedSupplier(null); } }
      );
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleToggleActive = (supplier: Supplier) => {
    updateSupplier.mutate({ id: supplier.id, data: { is_active: !supplier.is_active } });
  };

  const handleDelete = () => {
    if (!selectedSupplier) return;
    deleteSupplier.mutate(selectedSupplier.id, {
      onSuccess: () => { setDeleteOpen(false); setSelectedSupplier(null); }
    });
  };

  const activeCount = suppliers.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {suppliers.length} {t('totalSuppliers')} • {activeCount} {t('active')}
          </p>
        </div>
        <button
          onClick={() => { setSelectedSupplier(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addSupplier')}
        </button>
      </div>

      <SupplierFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <SuppliersTable
          suppliers={filtered}
          onEdit={(supplier) => { setSelectedSupplier(supplier); setFormOpen(true); }}
          onDelete={(supplier) => { setSelectedSupplier(supplier); setDeleteOpen(true); }}
          onToggleActive={handleToggleActive}
        />
      )}

      <SupplierFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedSupplier(null); }}
        onSubmit={handleSubmit}
        supplier={selectedSupplier}
        isLoading={createSupplier.isPending || updateSupplier.isPending}
      />
      <DeleteSupplierModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedSupplier(null); }}
        onConfirm={handleDelete}
        supplier={selectedSupplier}
        isLoading={deleteSupplier.isPending}
      />
    </div>
  );
}

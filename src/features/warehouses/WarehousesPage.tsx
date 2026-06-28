'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from './hooks/useWarehouses';
import { WarehouseFiltersBar } from './components/WarehouseFilters';
import { WarehousesTable } from './components/WarehousesTable';
import { WarehouseFormModal } from './components/WarehouseFormModal';
import { DeleteWarehouseModal } from './components/DeleteWarehouseModal';
import { Warehouse, WarehouseFilters, CreateWarehouseDTO } from './types/warehouse.types';

export function WarehousesPage() {
  const t = useTranslations('warehouses');
  const { data: warehouses = [], isLoading } = useWarehouses();

  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const [filters, setFilters] = useState<WarehouseFilters>({ search: '', is_active: 'all' });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const filtered = useMemo(() => {
    return warehouses.filter((warehouse) => {
      if (filters.search &&
        !warehouse.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !warehouse.code.toLowerCase().includes(filters.search.toLowerCase())
      ) return false;
      if (filters.is_active !== 'all' && warehouse.is_active !== filters.is_active) return false;
      return true;
    });
  }, [warehouses, filters]);

  const handleSubmit = (data: CreateWarehouseDTO) => {
    if (selectedWarehouse) {
      updateWarehouse.mutate(
        { id: selectedWarehouse.id, data },
        { onSuccess: () => { setFormOpen(false); setSelectedWarehouse(null); } }
      );
    } else {
      createWarehouse.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleToggleActive = (warehouse: Warehouse) => {
    updateWarehouse.mutate({ id: warehouse.id, data: { is_active: !warehouse.is_active } });
  };

  const handleDelete = () => {
    if (!selectedWarehouse) return;
    deleteWarehouse.mutate(selectedWarehouse.id, {
      onSuccess: () => { setDeleteOpen(false); setSelectedWarehouse(null); }
    });
  };

  const activeCount = warehouses.filter(w => w.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {warehouses.length} {t('totalWarehouses')} • {activeCount} {t('active')}
          </p>
        </div>
        <button
          onClick={() => { setSelectedWarehouse(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addWarehouse')}
        </button>
      </div>

      <WarehouseFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      ) : (
        <WarehousesTable
          warehouses={filtered}
          onEdit={(warehouse) => { setSelectedWarehouse(warehouse); setFormOpen(true); }}
          onDelete={(warehouse) => { setSelectedWarehouse(warehouse); setDeleteOpen(true); }}
          onToggleActive={handleToggleActive}
        />
      )}

      <WarehouseFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedWarehouse(null); }}
        onSubmit={handleSubmit}
        warehouse={selectedWarehouse}
        isLoading={createWarehouse.isPending || updateWarehouse.isPending}
      />
      <DeleteWarehouseModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedWarehouse(null); }}
        onConfirm={handleDelete}
        warehouse={selectedWarehouse}
        isLoading={deleteWarehouse.isPending}
      />
    </div>
  );
}

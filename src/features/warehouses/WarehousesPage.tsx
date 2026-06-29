'use client';

import { useState, useMemo } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations } from 'next-intl';
import { Plus, Warehouse as WarehouseIcon, MapPin, Wallet } from 'lucide-react';
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from './hooks/useWarehouses';
import { useInventoryDashboard } from '../inventory-dashboard/hooks/useInventoryDashboard';
import { WarehouseFiltersBar } from './components/WarehouseFilters';
import { WarehousesTable } from './components/WarehousesTable';
import { WarehouseFormModal } from './components/WarehouseFormModal';
import { DeleteWarehouseModal } from './components/DeleteWarehouseModal';
import { Warehouse, WarehouseFilters, CreateWarehouseDTO } from './types/warehouse.types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
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

export function WarehousesPage() {
  const t = useTranslations('warehouses');
  const { data: warehouses = [], isLoading } = useWarehouses();
  const { data: dashboard } = useInventoryDashboard();

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
  const totalLocations = useMemo(
    () => (dashboard?.warehouses ?? []).reduce((sum, w) => sum + w.location_count, 0),
    [dashboard]
  );
  const totalInventoryValue = useMemo(
    () => (dashboard?.warehouses ?? []).reduce((sum, w) => sum + Number(w.inventory_value), 0),
    [dashboard]
  );

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label={t('totalWarehouses')} value={warehouses.length} icon={WarehouseIcon} />
        <SummaryCard label={t('active')} value={activeCount} icon={WarehouseIcon} />
        <SummaryCard label={t('totalLocations')} value={totalLocations} icon={MapPin} />
        <SummaryCard label={t('inventoryValue')} value={formatCurrency(totalInventoryValue)} icon={Wallet} />
      </div>

      <WarehouseFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <WarehousesTable
          warehouses={filtered}
          onEdit={(warehouse) => { setSelectedWarehouse(warehouse); setFormOpen(true); }}
          onDelete={(warehouse) => { setSelectedWarehouse(warehouse); setDeleteOpen(true); }}
          onToggleActive={handleToggleActive}
          onCreate={() => { setSelectedWarehouse(null); setFormOpen(true); }}
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

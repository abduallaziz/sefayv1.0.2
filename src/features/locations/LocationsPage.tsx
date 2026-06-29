'use client';

import { useState } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useWarehouses } from '../warehouses/hooks/useWarehouses';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from './hooks/useLocations';
import { LocationFiltersBar } from './components/LocationFilters';
import { LocationsTable } from './components/LocationsTable';
import { LocationFormModal } from './components/LocationFormModal';
import { DeleteLocationModal } from './components/DeleteLocationModal';
import { Location, CreateLocationDTO } from './types/location.types';

const LIMIT = 20;

export function LocationsPage() {
  const t = useTranslations('locations');
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();

  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const effectiveWarehouseId = warehouseId ?? warehouses[0]?.id ?? null;

  const [resetKey, setResetKey] = useState<string>('');
  const currentResetKey = `${effectiveWarehouseId ?? ''}:${search}`;
  if (currentResetKey !== resetKey) {
    setResetKey(currentResetKey);
    if (page !== 1) setPage(1);
  }

  const { data, isLoading } = useLocations(effectiveWarehouseId, { search, page, limit: LIMIT });
  const locations = data?.data ?? [];
  const total = data?.total ?? 0;

  const createLocation = useCreateLocation(effectiveWarehouseId);
  const updateLocation = useUpdateLocation(effectiveWarehouseId);
  const deleteLocation = useDeleteLocation(effectiveWarehouseId);

  const handleSubmit = (data: CreateLocationDTO) => {
    if (selectedLocation) {
      updateLocation.mutate(
        { id: selectedLocation.id, data },
        { onSuccess: () => { setFormOpen(false); setSelectedLocation(null); } }
      );
    } else {
      createLocation.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleToggleActive = (location: Location) => {
    updateLocation.mutate({ id: location.id, data: { is_active: !location.is_active } });
  };

  const handleDelete = () => {
    if (!selectedLocation) return;
    deleteLocation.mutate(selectedLocation.id, {
      onSuccess: () => { setDeleteOpen(false); setSelectedLocation(null); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('totalLocations')}</p>
        </div>
        <button
          onClick={() => { setSelectedLocation(null); setFormOpen(true); }}
          disabled={!effectiveWarehouseId}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {t('addLocation')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={effectiveWarehouseId ?? ''}
          onChange={(e) => setWarehouseId(e.target.value || null)}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] text-slate-800 dark:text-white min-w-[180px]"
        >
          {warehouses.length === 0 && <option value="">{t('noWarehouse')}</option>}
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <LocationFiltersBar search={search} onSearchChange={setSearch} />
      </div>

      {!effectiveWarehouseId ? (
        warehousesLoading ? (
          <TableSkeleton />
        ) : (
          <p className="text-sm text-slate-500 text-center py-12">{t('selectWarehouseHint')}</p>
        )
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <LocationsTable
          locations={locations}
          total={total}
          page={page}
          limit={LIMIT}
          onPageChange={setPage}
          onEdit={(location) => { setSelectedLocation(location); setFormOpen(true); }}
          onDelete={(location) => { setSelectedLocation(location); setDeleteOpen(true); }}
          onToggleActive={handleToggleActive}
          onCreate={() => { setSelectedLocation(null); setFormOpen(true); }}
        />
      )}

      <LocationFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedLocation(null); }}
        onSubmit={handleSubmit}
        location={selectedLocation}
        isLoading={createLocation.isPending || updateLocation.isPending}
      />
      <DeleteLocationModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedLocation(null); }}
        onConfirm={handleDelete}
        location={selectedLocation}
        isLoading={deleteLocation.isPending}
      />
    </div>
  );
}

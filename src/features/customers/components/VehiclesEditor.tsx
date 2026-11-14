'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Car, Plus, Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { PLATE_MAX_LENGTH } from '../lib/customer-input';
import { useCustomerVehicles, useVehicleMutations } from '../hooks/useCustomers';
import type { CustomerVehicle } from '../types/customer.types';

const SIZES = ['small', 'medium', 'large', 'xlarge'] as const;

// No w-full here: the plate input and the size select share one row.
const inputClass = 'px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

/**
 * Cars of one customer. Each action (rename a plate, change the size, remove,
 * add) is saved straight away, so nothing is lost if the form is closed; the
 * server keeps a plate unique per tenant.
 */
export function VehiclesEditor({ customerId }: { customerId: string }) {
  const t = useTranslations('customers.form.vehicles');
  const { data: vehicles = [], isLoading } = useCustomerVehicles(customerId);
  const { add, update, remove } = useVehicleMutations(customerId);
  const [error, setError] = useState<string | null>(null);
  const [newPlate, setNewPlate] = useState('');
  const [newSize, setNewSize] = useState('');

  const fail = (e: unknown) =>
    setError(
      e instanceof ApiError && e.status === 409
        ? t('plateTaken')
        : e instanceof Error && e.message
          ? e.message
          : t('failed'),
    );

  const handleAdd = () => {
    const plate = newPlate.trim();
    if (!plate || add.isPending) return;
    setError(null);
    add.mutate(
      { plate, size: newSize || undefined },
      {
        onSuccess: () => { setNewPlate(''); setNewSize(''); },
        onError: fail,
      },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <Car className="w-4 h-4" />
        {t('title')}
      </div>

      {isLoading ? (
        <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ) : vehicles.length === 0 ? (
        <p className="text-xs text-slate-400">{t('empty')}</p>
      ) : (
        vehicles.map((v) => (
          <VehicleRow
            key={v.id}
            vehicle={v}
            onPlate={(plate, revert) => {
              setError(null);
              update.mutate(
                { vehicleId: v.id, dto: { plate } },
                { onError: (e) => { fail(e); revert(); } },
              );
            }}
            onSize={(size) => {
              setError(null);
              update.mutate({ vehicleId: v.id, dto: { size } }, { onError: fail });
            }}
            onRemove={() => {
              setError(null);
              remove.mutate(v.id, { onError: fail });
            }}
            removeLabel={t('remove')}
            sizeLabel={t('size')}
          />
        ))
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          dir="ltr"
          maxLength={PLATE_MAX_LENGTH}
          value={newPlate}
          onChange={(e) => setNewPlate(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={t('plate')}
          className={`${inputClass} flex-1 min-w-0`}
        />
        <select
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          aria-label={t('size')}
          className={`${inputClass} w-28 shrink-0`}
        >
          <option value="">{t('size')}</option>
          {SIZES.map((s) => <option key={s} value={s}>{t(`sizes.${s}`)}</option>)}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newPlate.trim() || add.isPending}
          aria-label={t('add')}
          title={t('add')}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0C447C] text-white hover:bg-[#0a3a6b] disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function VehicleRow({
  vehicle, onPlate, onSize, onRemove, removeLabel, sizeLabel,
}: {
  vehicle: CustomerVehicle;
  onPlate: (plate: string, revert: () => void) => void;
  onSize: (size: string) => void;
  onRemove: () => void;
  removeLabel: string;
  sizeLabel: string;
}) {
  const t = useTranslations('customers.form.vehicles');
  const [plate, setPlate] = useState(vehicle.plate);

  const commitPlate = () => {
    const next = plate.trim();
    if (!next) { setPlate(vehicle.plate); return; }
    if (next !== vehicle.plate) onPlate(next, () => setPlate(vehicle.plate));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        dir="ltr"
        maxLength={PLATE_MAX_LENGTH}
        value={plate}
        onChange={(e) => setPlate(e.target.value)}
        onBlur={commitPlate}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
        className={`${inputClass} flex-1 min-w-0`}
      />
      <select
        value={vehicle.size ?? ''}
        onChange={(e) => onSize(e.target.value)}
        aria-label={sizeLabel}
        className={`${inputClass} w-28 shrink-0`}
      >
        <option value="">{sizeLabel}</option>
        {SIZES.map((s) => <option key={s} value={s}>{t(`sizes.${s}`)}</option>)}
      </select>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

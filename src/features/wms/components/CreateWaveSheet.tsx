'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/shared/ui/sheet';
import { SectionCard } from '@/shared/ui/section-card';
import { SingleDatePicker } from '@/shared/ui/date-range-picker/SingleDatePicker';
import { EmptyState } from '@/shared/ui/empty-state';
import { ApiError } from '@/lib/api';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useLocations } from '../../locations/hooks/useLocations';
import { useCreateWave } from '../hooks/useWms';
import { CreateWaveCriteria } from '../types/wms.types';
import { translateEnum } from '../lib/enumTranslation';

// Inventory #7 / F10 (Owner-approved) — Wave Create/Criteria Builder.
// Source of truth: POST /inventory/wms/waves (createWave, CreateWaveDto) —
// already exists, no backend change. `criteria` is validated ONLY inside
// fn_evaluate_wave_eligibility at evaluation time (migration 232), not at
// creation — this builder produces exactly the key/value shapes that
// function accepts (13 of its 14 known keys) so a wave created here will
// evaluate cleanly later, but the backend remains the sole authority; this
// form does not duplicate or pre-validate that RPC's logic.
//
// F10 zone-criteria gap closure (Owner-approved) — `zone_ids` is now
// offered too, sourced from the existing Locations feature's
// GET /inventory/warehouses/:warehouseId/locations endpoint (extended
// with a `locationType` filter, not duplicated) filtered to
// location_type='zone' — the real, sole hierarchy-root location type
// (migration 097: a location with no parent must be a zone). No new
// table, no new zones concept — this is the exact same zone identity
// fn_location_is_in_zone (migration 227) and fn_evaluate_wave_eligibility
// (migration 231/232, `z.zone_id::uuid`) already use.
//
// `route`/`carrier`/`order_type` are free-text inputs, not dropdowns —
// shipments.reference_type/.route/.carrier are plain unconstrained TEXT
// columns with no CHECK-constraint enum or lookup table (confirmed via
// migration read), so a fake dropdown would invent reference data that
// doesn't exist.

const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;
const BOOLEAN_CRITERIA_KEYS = [
  'require_inventory_ready',
  'require_replenishment_ready',
  'capacity_ok',
  'labor_available',
  'dock_ready',
  'customer_service_level_ok',
] as const;
const DATE_CRITERIA_KEYS = ['cutoff_before', 'release_after', 'release_before'] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWaveSheet({ open, onOpenChange }: Props) {
  const t = useTranslations('wms');
  const { data: warehouses = [] } = useWarehouses();
  const createMutation = useCreateWave();

  const [warehouseId, setWarehouseId] = useState('');
  const [zoneIds, setZoneIds] = useState<Set<string>>(new Set());
  const [priorityMin, setPriorityMin] = useState('');
  const [route, setRoute] = useState('');
  const [carrier, setCarrier] = useState('');
  const [orderType, setOrderType] = useState('');
  const [dates, setDates] = useState<Record<(typeof DATE_CRITERIA_KEYS)[number], string | undefined>>({
    cutoff_before: undefined,
    release_after: undefined,
    release_before: undefined,
  });
  const [booleans, setBooleans] = useState<Record<(typeof BOOLEAN_CRITERIA_KEYS)[number], '' | 'true' | 'false'>>({
    require_inventory_ready: '',
    require_replenishment_ready: '',
    capacity_ok: '',
    labor_available: '',
    dock_ready: '',
    customer_service_level_ok: '',
  });

  const zones = useLocations(warehouseId || null, { locationType: 'zone', isActive: true, limit: 100 });
  const zoneRows = zones.data?.data ?? [];

  const toggleZone = (id: string) => {
    setZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setWarehouseId('');
    setZoneIds(new Set());
    setPriorityMin('');
    setRoute('');
    setCarrier('');
    setOrderType('');
    setDates({ cutoff_before: undefined, release_after: undefined, release_before: undefined });
    setBooleans({
      require_inventory_ready: '', require_replenishment_ready: '', capacity_ok: '',
      labor_available: '', dock_ready: '', customer_service_level_ok: '',
    });
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    onOpenChange(false);
    reset();
  };

  const buildCriteria = (): CreateWaveCriteria => {
    const criteria: CreateWaveCriteria = {};
    if (priorityMin) criteria.priority_min = priorityMin as CreateWaveCriteria['priority_min'];
    if (zoneIds.size > 0) criteria.zone_ids = Array.from(zoneIds);
    if (route.trim()) criteria.route = route.trim();
    if (carrier.trim()) criteria.carrier = carrier.trim();
    if (orderType.trim()) criteria.order_type = orderType.trim();
    for (const key of DATE_CRITERIA_KEYS) {
      const v = dates[key];
      if (v) criteria[key] = v;
    }
    for (const key of BOOLEAN_CRITERIA_KEYS) {
      const v = booleans[key];
      if (v) criteria[key] = v;
    }
    return criteria;
  };

  const handleSubmit = () => {
    if (!warehouseId || createMutation.isPending) return;
    const criteria = buildCriteria();
    createMutation.mutate(
      { warehouse_id: warehouseId, ...(Object.keys(criteria).length > 0 ? { criteria } : {}) },
      {
        onSuccess: () => {
          toast.success(t('waves.create.success'));
          onOpenChange(false);
          reset();
        },
        onError: (err) => {
          const message = err instanceof ApiError ? err.message : t('waves.create.error');
          toast.error(message);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('waves.create.title')}</SheetTitle>
          <SheetDescription>{t('waves.create.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('waves.create.warehouse')}</label>
            <select
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setZoneIds(new Set()); }}
              className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
            >
              <option value="">{t('waves.create.selectWarehouse')}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <SectionCard title={t('waves.create.criteriaTitle')} theme="dashboard">
            <div className="space-y-4">
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('waves.create.criteriaExplainer')}
              </p>

              <div className="space-y-1.5">
                <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('waves.criteria.zone_ids')}</label>
                {!warehouseId ? (
                  <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.create.selectWarehouseFirst')}</p>
                ) : zones.isLoading ? (
                  <div className="p-3 text-center text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary rounded-lg border border-posCloud-border dark:border-posCloudDark-border">
                    {t('waves.create.zonesLoading')}
                  </div>
                ) : zones.isError ? (
                  <div className="flex items-center gap-2 rounded-lg border border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/15 px-3.5 py-2.5 text-xs text-posCloud-danger">
                    {t('waves.create.zonesError')}
                  </div>
                ) : zoneRows.length === 0 ? (
                  <EmptyState icon={AlertTriangle} theme="inventory" size="sm" title={t('waves.create.noZones')} />
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-posCloud-border dark:border-posCloudDark-border divide-y divide-slate-100 dark:divide-posCloudDark-border">
                    {zoneRows.map((z) => (
                      <label key={z.id} className="flex items-center gap-3 px-3.5 py-2 text-sm cursor-pointer hover:bg-posCloud-background dark:hover:bg-posCloudDark-background">
                        <input
                          type="checkbox"
                          checked={zoneIds.has(z.id)}
                          onChange={() => toggleZone(z.id)}
                          className="shrink-0"
                          aria-label={t('waves.create.selectZone', { name: z.name })}
                        />
                        <span className="min-w-0 truncate">{z.code} — {z.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {zoneIds.size > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      {t('waves.create.zonesSelectedCount', { count: zoneIds.size })}
                    </span>
                    <button type="button" onClick={() => setZoneIds(new Set())} className="text-xs text-posCloud-primary hover:underline">
                      {t('waves.create.clearZones')}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('waves.criteria.priority_min')}</label>
                <select
                  value={priorityMin}
                  onChange={(e) => setPriorityMin(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                >
                  <option value="">{t('waves.create.notSet')}</option>
                  {PRIORITY_KEYS.map((k) => (
                    <option key={k} value={k}>{translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, k)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('waves.criteria.route')}</label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder={t('waves.create.freeTextPlaceholder')}
                    className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('waves.criteria.carrier')}</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder={t('waves.create.freeTextPlaceholder')}
                    className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('waves.criteria.order_type')}</label>
                  <input
                    type="text"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    placeholder={t('waves.create.freeTextPlaceholder')}
                    className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DATE_CRITERIA_KEYS.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t(`waves.criteria.${key}`)}</label>
                    <SingleDatePicker
                      value={dates[key]}
                      onChange={(v) => setDates((prev) => ({ ...prev, [key]: v }))}
                      placeholder={t('waves.create.selectDate')}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BOOLEAN_CRITERIA_KEYS.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t(`waves.criteria.${key}`)}</label>
                    <select
                      value={booleans[key]}
                      onChange={(e) => setBooleans((prev) => ({ ...prev, [key]: e.target.value as '' | 'true' | 'false' }))}
                      className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                    >
                      <option value="">{t('waves.create.notSet')}</option>
                      <option value="true">{t('waves.criteria.yes')}</option>
                      <option value="false">{t('waves.criteria.no')}</option>
                    </select>
                  </div>
                ))}
              </div>

            </div>
          </SectionCard>

          <button
            type="button"
            disabled={!warehouseId || createMutation.isPending}
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
          >
            {createMutation.isPending ? t('waves.create.creating') : t('waves.create.confirm')}
          </button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardList, ScanLine, Waves, Truck, AlertTriangle, PackageCheck,
  Clock, UserCheck, CheckCircle2, XCircle, PlayCircle, PackagePlus,
} from 'lucide-react';
import { SectionCard } from '@/shared/ui/section-card';
import { StatCard } from '@/shared/ui/stat-card';
import { StatCardSkeleton } from '@/shared/ui/skeleton';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusBadge } from '@/shared/ui/status-badge';
import { DateRangePicker, type DateRange } from '@/shared/ui/date-range-picker';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/shared/ui/select';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import {
  useWmsTaskOverview, useWmsPickListOverview, useWmsWaveOverview,
  useWmsShipmentOverview, useWmsExceptionOverview, useWmsReservationOverview,
} from '../hooks/useWmsDashboard';
import { translateEnum } from '../lib/enumTranslation';

// Inventory #7 / F1 (Owner-approved) — real WMS operational overview,
// replacing the previous client-side-computed fake dashboard tab.
// Every number rendered here is sourced directly from a 7-8 backend
// aggregate (fn_wms_*), never computed from a fetched list in the
// browser. Each section is an independently-loading/erroring widget so
// one failed aggregate does not corrupt the others.

// Inventory #7 / F1 residual localization fix (Owner-approved) — the two
// real backend enums this dashboard renders as badges are `pick_lists.strategy`
// ('single'|'batch'|'wave'|'zone', migration 116) and
// `warehouse_exceptions.exception_type` ('short_pick'|'damaged'|'lost'|'cancelled',
// migration 239) — both confirmed exhaustive against their live DB CHECK
// constraints. `top_reasons[].reason` is genuine free text entered by an
// actor at exception-recording time, not an enum, and is deliberately left
// untranslated — translating arbitrary user-entered text would be wrong,
// not a residual gap. Unmapped values fall back to the raw value (never a
// blank/crashed badge) and are reported via console.warn for the audit
// trail, per the explicit "report, don't invent" instruction.
const STRATEGY_KEYS = ['single', 'batch', 'zone', 'wave'] as const;
const EXCEPTION_TYPE_KEYS = ['short_pick', 'damaged', 'lost', 'cancelled'] as const;

function WidgetShell({
  isLoading,
  isError,
  isEmpty,
  emptyLabel,
  errorLabel,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  errorLabel: string;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-posCloud-danger py-6">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>{errorLabel}</span>
      </div>
    );
  }
  if (isEmpty) {
    return <EmptyState title={emptyLabel ?? ''} size="sm" theme="inventory" />;
  }
  return <>{children}</>;
}

export function WmsOverviewDashboard() {
  const t = useTranslations('wms');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const { data: warehouses = [] } = useWarehouses();

  const tasks = useWmsTaskOverview(warehouseId || undefined);
  const pickLists = useWmsPickListOverview(warehouseId || undefined);
  const waves = useWmsWaveOverview(warehouseId || undefined);
  const shipments = useWmsShipmentOverview(warehouseId || undefined);
  const exceptions = useWmsExceptionOverview(
    warehouseId || undefined,
    dateRange.from,
    dateRange.to,
  );
  const reservations = useWmsReservationOverview(warehouseId || undefined);

  return (
    <div className="space-y-6">
      {/* Filter bar — server-backed; changing either refetches the authoritative aggregates */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={warehouseId || 'all'} onValueChange={(v) => setWarehouseId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t('selectWarehouse')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('dashboard.allWarehouses')}</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder={t('dashboard.exceptionDateRange')}
          className="w-64"
        />
      </div>

      {/* Top-line: what needs attention now */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={t('dashboard.openTasks')}
          value={tasks.isLoading ? '—' : (tasks.data?.open ?? 0)}
          icon={ClipboardList}
          variant="info"
        />
        <StatCard
          title={t('dashboard.activePickLists')}
          value={pickLists.isLoading ? '—' : ((pickLists.data?.open ?? 0) + (pickLists.data?.in_progress ?? 0))}
          icon={ScanLine}
          variant="default"
        />
        <StatCard
          title={t('dashboard.activeWaves')}
          value={waves.isLoading ? '—' : (waves.data?.active ?? 0)}
          icon={Waves}
          variant="default"
        />
        <StatCard
          title={t('dashboard.openExceptions')}
          value={exceptions.isLoading ? '—' : (exceptions.data?.open ?? 0)}
          icon={AlertTriangle}
          variant={exceptions.data && exceptions.data.open > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Warehouse Work */}
      <SectionCard title={t('dashboard.sections.tasks')}>
        <WidgetShell
          isLoading={tasks.isLoading}
          isError={tasks.isError}
          errorLabel={t('dashboard.loadError')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <StatCard title={t('dashboard.total')} value={tasks.data?.total ?? 0} icon={ClipboardList} />
            <StatCard title={t('dashboard.pending')} value={tasks.data?.pending ?? 0} icon={Clock} variant="warning" />
            <StatCard title={t('dashboard.assigned')} value={tasks.data?.assigned ?? 0} icon={UserCheck} variant="info" />
            <StatCard title={t('dashboard.inProgress')} value={tasks.data?.in_progress ?? 0} icon={PlayCircle} variant="info" />
            <StatCard title={t('dashboard.completed')} value={tasks.data?.completed ?? 0} icon={CheckCircle2} variant="success" />
            <StatCard title={t('dashboard.cancelled')} value={tasks.data?.cancelled ?? 0} icon={XCircle} variant="danger" />
          </div>
        </WidgetShell>
      </SectionCard>

      {/* Picking */}
      <SectionCard title={t('dashboard.sections.picking')}>
        <WidgetShell
          isLoading={pickLists.isLoading}
          isError={pickLists.isError}
          errorLabel={t('dashboard.loadError')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <StatCard title={t('dashboard.open')} value={pickLists.data?.open ?? 0} icon={ScanLine} variant="info" />
            <StatCard title={t('dashboard.inProgress')} value={pickLists.data?.in_progress ?? 0} icon={PlayCircle} variant="info" />
            <StatCard title={t('dashboard.completed')} value={pickLists.data?.completed ?? 0} icon={CheckCircle2} variant="success" />
            <StatCard title={t('dashboard.cancelled')} value={pickLists.data?.cancelled ?? 0} icon={XCircle} variant="danger" />
            <StatCard title={t('dashboard.assigned')} value={pickLists.data?.assigned ?? 0} icon={UserCheck} />
            <StatCard title={t('dashboard.unassigned')} value={pickLists.data?.unassigned ?? 0} icon={Clock} variant="warning" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-posCloud-text-tertiary self-center">{t('dashboard.strategyDistribution')}:</span>
            {Object.entries(pickLists.data?.by_strategy ?? {}).map(([strategy, count]) => (
              <StatusBadge
                key={strategy}
                tone="neutral"
                label={`${translateEnum(t, 'dashboard.strategies', STRATEGY_KEYS, strategy)}: ${count}`}
              />
            ))}
            {Object.keys(pickLists.data?.by_strategy ?? {}).length === 0 && (
              <span className="text-xs text-posCloud-text-tertiary">—</span>
            )}
          </div>
        </WidgetShell>
      </SectionCard>

      {/* Waves */}
      <SectionCard title={t('dashboard.sections.waves')}>
        <WidgetShell
          isLoading={waves.isLoading}
          isError={waves.isError}
          errorLabel={t('dashboard.loadError')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard title={t('dashboard.active')} value={waves.data?.active ?? 0} icon={Waves} variant="info" />
            <StatCard title={t('dashboard.released')} value={waves.data?.released ?? 0} icon={PlayCircle} />
            <StatCard title={t('dashboard.completed')} value={waves.data?.completed ?? 0} icon={CheckCircle2} variant="success" />
            <StatCard title={t('dashboard.cancelled')} value={waves.data?.cancelled ?? 0} icon={XCircle} variant="danger" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title={t('dashboard.eligibleShipments')} value={waves.data?.eligible_shipments ?? 0} icon={PackageCheck} />
            <StatCard title={t('dashboard.claimedShipments')} value={waves.data?.claimed_shipments ?? 0} icon={PackageCheck} variant="info" />
            <StatCard title={t('dashboard.excludedShipments')} value={waves.data?.excluded_shipments ?? 0} icon={XCircle} />
            <StatCard
              title={t('dashboard.claimFailures')}
              value={waves.data?.failed_at_release_shipments ?? 0}
              icon={AlertTriangle}
              variant={waves.data && waves.data.failed_at_release_shipments > 0 ? 'warning' : 'success'}
            />
          </div>
        </WidgetShell>
      </SectionCard>

      {/* Shipments / Fulfillment */}
      <SectionCard title={t('dashboard.sections.shipments')}>
        <WidgetShell
          isLoading={shipments.isLoading}
          isError={shipments.isError}
          errorLabel={t('dashboard.loadError')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <StatCard title={t('dashboard.pending')} value={shipments.data?.pending ?? 0} icon={Clock} variant="warning" />
            <StatCard title={t('dashboard.picking')} value={shipments.data?.picking ?? 0} icon={ScanLine} variant="info" />
            <StatCard title={t('dashboard.picked')} value={shipments.data?.picked ?? 0} icon={PackageCheck} />
            <StatCard title={t('dashboard.shipped')} value={shipments.data?.shipped ?? 0} icon={Truck} variant="success" />
            <StatCard title={t('dashboard.cancelled')} value={shipments.data?.cancelled ?? 0} icon={XCircle} variant="danger" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title={t('dashboard.requestedQty')} value={shipments.data?.quantities.requested ?? 0} icon={PackagePlus} />
            <StatCard title={t('dashboard.pickedQty')} value={shipments.data?.quantities.picked ?? 0} icon={PackageCheck} variant="success" />
            <StatCard title={t('dashboard.exceptionQty')} value={shipments.data?.quantities.exception ?? 0} icon={AlertTriangle} variant="warning" />
            <StatCard title={t('dashboard.unfulfilledQty')} value={shipments.data?.quantities.unfulfilled ?? 0} icon={Clock} />
          </div>
        </WidgetShell>
      </SectionCard>

      {/* Exceptions */}
      <SectionCard title={t('dashboard.sections.exceptions')}>
        <WidgetShell
          isLoading={exceptions.isLoading}
          isError={exceptions.isError}
          isEmpty={!exceptions.isLoading && !exceptions.isError && (exceptions.data?.total ?? 0) === 0}
          emptyLabel={t('dashboard.noExceptions')}
          errorLabel={t('dashboard.loadError')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard
              title={translateEnum(t, 'dashboard.exceptionTypes', EXCEPTION_TYPE_KEYS, 'short_pick')}
              value={exceptions.data?.by_type?.short_pick?.count ?? 0}
              sub={t('dashboard.qty', { qty: exceptions.data?.by_type?.short_pick?.quantity ?? 0 })}
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard
              title={translateEnum(t, 'dashboard.exceptionTypes', EXCEPTION_TYPE_KEYS, 'damaged')}
              value={exceptions.data?.by_type?.damaged?.count ?? 0}
              sub={t('dashboard.qty', { qty: exceptions.data?.by_type?.damaged?.quantity ?? 0 })}
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard
              title={translateEnum(t, 'dashboard.exceptionTypes', EXCEPTION_TYPE_KEYS, 'lost')}
              value={exceptions.data?.by_type?.lost?.count ?? 0}
              sub={t('dashboard.qty', { qty: exceptions.data?.by_type?.lost?.quantity ?? 0 })}
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard
              title={translateEnum(t, 'dashboard.exceptionTypes', EXCEPTION_TYPE_KEYS, 'cancelled')}
              value={exceptions.data?.by_type?.cancelled?.count ?? 0}
              icon={XCircle}
            />
          </div>
          {(exceptions.data?.top_reasons?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-posCloud-text-tertiary self-center">{t('dashboard.topReasons')}:</span>
              {exceptions.data!.top_reasons.slice(0, 5).map((r) => (
                <StatusBadge key={r.reason} tone="neutral" label={`${r.reason} (${r.count})`} />
              ))}
            </div>
          )}
        </WidgetShell>
      </SectionCard>

      {/* Reservations */}
      <SectionCard title={t('dashboard.sections.reservations')}>
        <WidgetShell
          isLoading={reservations.isLoading}
          isError={reservations.isError}
          errorLabel={t('dashboard.loadError')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title={t('dashboard.reservedQty')}
              value={reservations.data?.active_quantity ?? 0}
              sub={t('dashboard.reservedCount', { count: reservations.data?.active_count ?? 0 })}
              icon={PackageCheck}
              variant="info"
            />
            <StatCard title={t('dashboard.released')} value={reservations.data?.released_count ?? 0} icon={CheckCircle2} variant="success" />
            <StatCard title={t('dashboard.consumed')} value={reservations.data?.consumed_count ?? 0} icon={PackageCheck} />
            <StatCard
              title={t('dashboard.reservationAffectingExceptions')}
              value={reservations.data?.reservation_affecting_exceptions ?? 0}
              icon={AlertTriangle}
              variant={reservations.data && reservations.data.reservation_affecting_exceptions > 0 ? 'warning' : 'success'}
            />
          </div>
        </WidgetShell>
      </SectionCard>
    </div>
  );
}

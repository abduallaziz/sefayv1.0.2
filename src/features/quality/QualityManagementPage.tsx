'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, ClipboardCheck, Lock, AlertTriangle, Wrench,
  CheckCircle2, XCircle, Gauge,
} from 'lucide-react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { usePermission } from '@/core/permissions/hooks/usePermission';
import { useItems } from '../items/hooks/useItems';
import {
  useInspections, useHolds, useNonConformances, useCorrectiveActions,
  useInspectionSummary, useNcrTrends, useCapaPerformance,
  useCompleteInspection, useReleaseHold, useUpdateNcrStatus, useCapaLifecycle,
} from './hooks/useQuality';

type Tab = 'dashboard' | 'inspections' | 'holds' | 'ncr' | 'capa';

const NC_NEXT: Record<string, string | null> = {
  open: 'investigating',
  investigating: 'containment',
  containment: 'corrective_action',
  corrective_action: 'verification',
  verification: 'closed',
  closed: null,
};

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600', passed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
    conditional: 'bg-amber-100 text-amber-700', active: 'bg-amber-100 text-amber-700', released: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700', open: 'bg-red-100 text-red-700', investigating: 'bg-amber-100 text-amber-700',
    containment: 'bg-amber-100 text-amber-700', corrective_action: 'bg-blue-100 text-blue-700',
    verification: 'bg-blue-100 text-blue-700', closed: 'bg-green-100 text-green-700', assigned: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-amber-100 text-amber-700', verified: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

export function QualityManagementPage() {
  const t = useTranslations('quality');
  const [tab, setTab] = useState<Tab>('dashboard');
  const canExecute = usePermission('quality.execute');
  const canApprove = usePermission('quality.approve');
  const canManage = usePermission('quality.manage');

  const { data: items = [] } = useItems();
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;

  const inspections = useInspections();
  const holds = useHolds();
  const ncrs = useNonConformances();
  const capas = useCorrectiveActions();
  const inspectionSummary = useInspectionSummary();
  const ncrTrends = useNcrTrends();
  const capaPerformance = useCapaPerformance();

  const completeInspection = useCompleteInspection();
  const releaseHold = useReleaseHold();
  const updateNcrStatus = useUpdateNcrStatus();
  const capaLifecycle = useCapaLifecycle();

  const activeHoldsCount = useMemo(() => (holds.data ?? []).filter((h) => h.status === 'active').length, [holds.data]);
  const openNcrCount = useMemo(() => (ncrs.data ?? []).filter((n) => n.status !== 'closed').length, [ncrs.data]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('tabs.dashboard'), icon: LayoutDashboard },
    { key: 'inspections', label: t('tabs.inspections'), icon: ClipboardCheck },
    { key: 'holds', label: t('tabs.holds'), icon: Lock },
    { key: 'ncr', label: t('tabs.ncr'), icon: AlertTriangle },
    { key: 'capa', label: t('tabs.capa'), icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label={t('kpi.passRate')} value={inspectionSummary.data?.pass_rate_percentage != null ? `${inspectionSummary.data.pass_rate_percentage}%` : '—'} icon={CheckCircle2} />
          <KpiCard label={t('kpi.failureRate')} value={inspectionSummary.data?.failure_rate_percentage != null ? `${inspectionSummary.data.failure_rate_percentage}%` : '—'} icon={XCircle} />
          <KpiCard label={t('kpi.activeHolds')} value={String(activeHoldsCount)} icon={Lock} />
          <KpiCard label={t('kpi.openNcr')} value={String(openNcrCount)} icon={AlertTriangle} />
          <KpiCard label={t('kpi.ncrTotal')} value={String(ncrTrends.data?.total ?? 0)} icon={Gauge} />
          <KpiCard label={t('kpi.capaCompletion')} value={capaPerformance.data?.completion_rate_percentage != null ? `${capaPerformance.data.completion_rate_percentage}%` : '—'} icon={Wrench} />
          <KpiCard label={t('kpi.capaOverdue')} value={String(capaPerformance.data?.overdue_count ?? 0)} icon={AlertTriangle} />
          <KpiCard label={t('kpi.pendingInspections')} value={String(inspectionSummary.data?.pending ?? 0)} icon={ClipboardCheck} />
        </div>
      )}

      {tab === 'inspections' && (
        inspections.isLoading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.item')}</th>
                  <th className="text-start px-4 py-3">{t('columns.source')}</th>
                  <th className="text-start px-4 py-3">{t('columns.status')}</th>
                  {canExecute && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {(inspections.data ?? []).map((i) => (
                  <tr key={i.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{itemName(i.item_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{i.reference_type}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    {canExecute && (
                      <td className="px-4 py-3 flex gap-2">
                        {i.status === 'pending' && (
                          <>
                            <button onClick={() => completeInspection.mutate({ id: i.id, body: { status: 'passed' } })} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">{t('actions.pass')}</button>
                            <button onClick={() => completeInspection.mutate({ id: i.id, body: { status: 'failed', auto_hold: true } })} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">{t('actions.fail')}</button>
                            <button onClick={() => completeInspection.mutate({ id: i.id, body: { status: 'conditional' } })} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">{t('actions.conditional')}</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {(inspections.data ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'holds' && (
        holds.isLoading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.item')}</th>
                  <th className="text-start px-4 py-3">{t('columns.quantityHeld')}</th>
                  <th className="text-start px-4 py-3">{t('columns.reason')}</th>
                  <th className="text-start px-4 py-3">{t('columns.status')}</th>
                  {canApprove && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {(holds.data ?? []).map((h) => (
                  <tr key={h.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{itemName(h.item_id)}</td>
                    <td className="px-4 py-3">{h.quantity_held ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{h.reason ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    {canApprove && (
                      <td className="px-4 py-3 flex gap-2">
                        {h.status === 'active' && (
                          <>
                            <button onClick={() => releaseHold.mutate({ id: h.id, body: { approved: true, reason: 'Released after review' } })} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">{t('actions.release')}</button>
                            <button onClick={() => releaseHold.mutate({ id: h.id, body: { approved: false, disposition: 'reject', reason: 'Rejected after review' } })} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">{t('actions.reject')}</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {(holds.data ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'ncr' && (
        ncrs.isLoading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.item')}</th>
                  <th className="text-start px-4 py-3">{t('columns.description')}</th>
                  <th className="text-start px-4 py-3">{t('columns.severity')}</th>
                  <th className="text-start px-4 py-3">{t('columns.status')}</th>
                  {canManage && <th className="text-start px-4 py-3">{t('columns.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {(ncrs.data ?? []).map((n) => {
                  const next = NC_NEXT[n.status];
                  return (
                    <tr key={n.id} className="border-t border-slate-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-slate-800 dark:text-white">{itemName(n.item_id)}</td>
                      <td className="px-4 py-3 text-slate-600">{n.description}</td>
                      <td className="px-4 py-3">{n.severity}</td>
                      <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {next && (
                            <button
                              onClick={() => updateNcrStatus.mutate({ id: n.id, body: { status: next } })}
                              className="text-xs px-2 py-1 rounded bg-[#0C447C]/10 text-[#0C447C] hover:bg-[#0C447C]/20"
                            >
                              {t('actions.advanceTo')} {next}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {(ncrs.data ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'capa' && (
        capas.isLoading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3">{t('columns.title')}</th>
                  <th className="text-start px-4 py-3">{t('columns.priority')}</th>
                  <th className="text-start px-4 py-3">{t('columns.dueDate')}</th>
                  <th className="text-start px-4 py-3">{t('columns.status')}</th>
                  <th className="text-start px-4 py-3">{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(capas.data ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{c.title}</td>
                    <td className="px-4 py-3">{c.priority}</td>
                    <td className="px-4 py-3">{c.due_date ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 flex gap-2">
                      {c.status === 'assigned' && canExecute && (
                        <button onClick={() => capaLifecycle.start.mutate(c.id)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">{t('actions.start')}</button>
                      )}
                      {c.status === 'in_progress' && canExecute && (
                        <button onClick={() => capaLifecycle.complete.mutate({ id: c.id, body: {} })} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">{t('actions.complete')}</button>
                      )}
                      {c.status === 'completed' && canApprove && (
                        <button onClick={() => capaLifecycle.verify.mutate({ id: c.id, body: { effectiveness_check: 'Verified effective' } })} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">{t('actions.verify')}</button>
                      )}
                      {c.status === 'verified' && canApprove && (
                        <button onClick={() => capaLifecycle.close.mutate({ id: c.id, body: {} })} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200">{t('actions.close')}</button>
                      )}
                    </td>
                  </tr>
                ))}
                {(capas.data ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

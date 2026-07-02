'use client';

import { useTranslations, useLocale } from 'next-intl';
import { PageHeaderSkeleton, CardListSkeleton, TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  useAdjustment,
  useApproveAdjustment,
  useRejectAdjustment,
  usePostAdjustment,
} from '../hooks/useAdjustments';
import { AdjustmentWorkflowTimeline } from '../components/AdjustmentWorkflowTimeline';

interface Props {
  id: string;
}

const statusColors: Record<string, string> = {
  pending_approval: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
  posted: 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]',
};

const statusLabelKeys = {
  pending_approval: 'status.pending_approval',
  approved: 'status.approved',
  rejected: 'status.rejected',
  posted: 'status.posted',
} as const;

export function AdjustmentDetailPage({ id }: Props) {
  const t = useTranslations('adjustments');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const canApprove =
    user?.role === 'owner' || user?.role === 'manager' || user?.role === 'superadmin';

  const { data: adjustment, isLoading } = useAdjustment(id);
  const approveAdjustment = useApproveAdjustment();
  const rejectAdjustment = useRejectAdjustment();
  const postAdjustment = usePostAdjustment();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <CardListSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (!adjustment) {
    return <div className="text-center py-16 text-slate-500">{t('notFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/dashboard/adjustments`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{adjustment.items?.name ?? adjustment.item_id}</h1>
          <p className="text-sm text-slate-500">#{adjustment.id}</p>
        </div>
        <span className={`ms-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[adjustment.status]}`}>
          {t(statusLabelKeys[adjustment.status])}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5">
        <AdjustmentWorkflowTimeline status={adjustment.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('warehouse')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{adjustment.warehouses?.name ?? adjustment.warehouse_id}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('quantityDelta')}</p>
          <p className={`font-medium ${adjustment.quantity_delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {adjustment.quantity_delta >= 0 ? '+' : ''}{adjustment.quantity_delta}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('unitCost')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{adjustment.unit_cost ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('requiresApproval')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{adjustment.requires_approval ? t('yes') : t('no')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('requestedBy')}</p>
          <p className="text-sm font-medium text-slate-800 dark:text-white">{adjustment.requested_by_user?.name ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('approvedBy')}</p>
          <p className="text-sm font-medium text-slate-800 dark:text-white">{adjustment.approved_by_user?.name ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
        <p className="text-xs text-slate-500 mb-1">{t('reason')}</p>
        <p className="text-sm text-slate-800 dark:text-white">{adjustment.reason}</p>
      </div>

      <div className="flex gap-3">
        {adjustment.status === 'pending_approval' && canApprove && (
          <>
            <button
              onClick={() => approveAdjustment.mutate(adjustment.id)}
              disabled={approveAdjustment.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {approveAdjustment.isPending ? t('approving') : t('approve')}
            </button>
            <button
              onClick={() => rejectAdjustment.mutate(adjustment.id)}
              disabled={rejectAdjustment.isPending}
              className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50"
            >
              {rejectAdjustment.isPending ? t('rejecting') : t('reject')}
            </button>
          </>
        )}
        {adjustment.status === 'approved' && (
          <button
            onClick={() => postAdjustment.mutate(adjustment.id)}
            disabled={postAdjustment.isPending}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {postAdjustment.isPending ? t('posting') : t('post')}
          </button>
        )}
      </div>
    </div>
  );
}

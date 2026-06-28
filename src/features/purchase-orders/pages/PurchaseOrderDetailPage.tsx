'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  usePurchaseOrder,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
} from '../hooks/usePurchaseOrders';
import { CancelPurchaseOrderModal } from '../components/CancelPurchaseOrderModal';
import { PurchaseOrderWorkflowTimeline } from '../components/PurchaseOrderWorkflowTimeline';

interface Props {
  id: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  submitted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  partially_received: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  received: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const statusLabelKeys = {
  draft: 'status.draft',
  submitted: 'status.submitted',
  approved: 'status.approved',
  partially_received: 'status.partially_received',
  received: 'status.received',
  cancelled: 'status.cancelled',
} as const;

export function PurchaseOrderDetailPage({ id }: Props) {
  const t = useTranslations('purchasing');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const canApprove =
    user?.role === 'owner' || user?.role === 'manager' || user?.role === 'superadmin';

  const { data: order, isLoading } = usePurchaseOrder(id);
  const submitOrder = useSubmitPurchaseOrder();
  const approveOrder = useApprovePurchaseOrder();
  const cancelOrder = useCancelPurchaseOrder();

  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center py-16 text-slate-500">{t('loading')}</div>;
  }

  if (!order) {
    return <div className="text-center py-16 text-slate-500">{t('notFound')}</div>;
  }

  const lineTotal = (order.items ?? []).reduce((sum, i) => sum + i.quantity_ordered * i.unit_cost, 0);
  const totalOrdered = (order.items ?? []).reduce((sum, i) => sum + i.quantity_ordered, 0);
  const totalReceived = (order.items ?? []).reduce((sum, i) => sum + i.quantity_received, 0);
  const receivingPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/dashboard/purchase-orders`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{order.order_number}</h1>
          <p className="text-sm text-slate-500">#{order.id}</p>
        </div>
        <span className={`ms-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
          {t(statusLabelKeys[order.status])}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5">
        <PurchaseOrderWorkflowTimeline status={order.status} />
      </div>

      {(order.status === 'partially_received' || order.status === 'received') && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">{t('receivingProgress')}</p>
            <p className="text-xs font-medium text-slate-700 dark:text-gray-300">
              {totalReceived} / {totalOrdered} ({receivingPct}%)
            </p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-[#0C447C] rounded-full"
              style={{ width: `${receivingPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('supplier')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{order.supplier_name ?? order.supplier_id}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('warehouse')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{order.warehouse_name ?? order.warehouse_id}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('orderDate')}</p>
          <p className="font-medium text-slate-800 dark:text-white">
            {order.order_date ? new Date(order.order_date).toLocaleDateString('en-US') : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('expectedDate')}</p>
          <p className="font-medium text-slate-800 dark:text-white">
            {order.expected_date ? new Date(order.expected_date).toLocaleDateString('en-US') : '—'}
          </p>
        </div>
      </div>

      {order.notes && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('notes')}</p>
          <p className="text-sm text-slate-800 dark:text-white">{order.notes}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('quantity')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('received')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('unitCost')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('lineTotal')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {(order.items ?? []).map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-slate-800 dark:text-white">
                  {item.item_name ?? item.item_id}
                  {item.variant_name && <span className="text-slate-400 text-xs ms-1">({item.variant_name})</span>}
                </td>
                <td className="px-3 py-3 text-slate-500">{item.quantity_ordered}</td>
                <td className="px-3 py-3">
                  <span
                    className={
                      item.quantity_received >= item.quantity_ordered
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.quantity_received > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                    }
                  >
                    {item.quantity_received}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-500">{item.unit_cost.toLocaleString('en-US')}</td>
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">
                  {(item.quantity_ordered * item.unit_cost).toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 dark:border-gray-800">
              <td colSpan={4} className="px-3 py-3 text-end font-semibold text-slate-800 dark:text-white">{t('total')}</td>
              <td className="px-3 py-3 font-bold text-slate-800 dark:text-white">{lineTotal.toLocaleString('en-US')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-3">
        {order.status === 'draft' && (
          <button
            onClick={() => submitOrder.mutate(order.id)}
            disabled={submitOrder.isPending}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {submitOrder.isPending ? t('submitting') : t('submit')}
          </button>
        )}
        {order.status === 'submitted' && canApprove && (
          <button
            onClick={() => approveOrder.mutate(order.id)}
            disabled={approveOrder.isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {approveOrder.isPending ? t('approving') : t('approve')}
          </button>
        )}
        {(order.status === 'draft' || order.status === 'submitted' || order.status === 'approved') && (
          <button
            onClick={() => setCancelOpen(true)}
            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            {t('cancelOrder')}
          </button>
        )}
      </div>

      <CancelPurchaseOrderModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelOrder.mutate(order.id, { onSuccess: () => setCancelOpen(false) });
        }}
        isLoading={cancelOrder.isPending}
      />
    </div>
  );
}

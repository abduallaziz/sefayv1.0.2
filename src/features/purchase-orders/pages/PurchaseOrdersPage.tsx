'use client';

import { useState } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardList, Download } from 'lucide-react';
import { usePurchaseOrders, useCreatePurchaseOrder } from '../hooks/usePurchaseOrders';
import { PurchaseOrderFiltersBar } from '../components/PurchaseOrderFilters';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import { PurchaseOrderFormModal } from '../components/PurchaseOrderFormModal';
import { PurchaseOrder, PurchaseOrderFilters, CreatePurchaseOrderDTO } from '../types/purchase-order.types';
import { exportPurchaseOrdersToCsv } from '../utils/exportPurchaseOrders';

export function PurchaseOrdersPage() {
  const t = useTranslations('purchasing');
  const locale = useLocale();
  const router = useRouter();

  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  const [formOpen, setFormOpen] = useState(false);

  const { data: orders = [], isLoading } = usePurchaseOrders(filters);
  const createOrder = useCreatePurchaseOrder();

  const handleView = (order: PurchaseOrder) => {
    router.push(`/${locale}/dashboard/purchase-orders/${order.id}`);
  };

  const handleSubmit = (data: CreatePurchaseOrderDTO) => {
    createOrder.mutate(data, {
      onSuccess: (newOrder) => {
        setFormOpen(false);
        router.push(`/${locale}/dashboard/purchase-orders/${newOrder.id}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <ClipboardList size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('purchaseOrders')}</h1>
            <p className="text-sm text-slate-500">{orders.length} {t('totalOrders')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPurchaseOrdersToCsv(orders)}
            disabled={orders.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {t('export')}
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('createPurchaseOrder')}
          </button>
        </div>
      </div>

      <PurchaseOrderFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <PurchaseOrdersTable orders={orders} onView={handleView} />
      )}

      <PurchaseOrderFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createOrder.isPending}
      />
    </div>
  );
}

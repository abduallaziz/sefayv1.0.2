'use client';

import { useState } from 'react';
import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  order: Order | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
  isLoading?: boolean;
}

export function CancelOrderModal({ order, onClose, onConfirm, isLoading }: Props) {
  const t = useTranslations('orders');
  const [reason, setReason] = useState('');

  if (!order) return null;

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={() => onConfirm(order.id, reason)}
      variant="danger"
      title={t('cancelTitle')}
      confirmLabel={t('confirmCancel')}
      cancelLabel={t('back')}
      loadingLabel={t('cancelling')}
      isLoading={isLoading}
      message={
        <div className="text-start space-y-3">
          <p>
            {t('cancelConfirm')} <span className="font-semibold text-slate-700 dark:text-white">#{order.id} — {order.total} ر.س</span>
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              {t('cancelReason')} <span className="text-slate-400 font-normal">{t('cancelReasonOptional')}</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('cancelReasonPlaceholder')}
              rows={3}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      }
    />
  );
}

'use client';

import { useState } from 'react';
import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { formatNumber } from '@/lib/format';

interface Props {
  order: Order | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
  isLoading?: boolean;
}

export function CancelOrderModal({ order, onClose, onConfirm, isLoading }: Props) {
  const t = useTranslations('orders');
  const currency = useCurrencyDisplay();
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);

  if (!order) return null;

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={() => {
        // A cancelled invoice must always carry its reason.
        if (!reason.trim()) {
          setShowError(true);
          return;
        }
        onConfirm(order.id, reason.trim());
      }}
      variant="danger"
      title={t('cancel.title')}
      confirmLabel={t('cancel.submit')}
      cancelLabel={t('back')}
      loadingLabel={t('cancel.submitting')}
      isLoading={isLoading}
      message={
        <div className="text-start space-y-3">
          <p>
            {t('cancel.confirm')} <span className="font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary"><span dir="ltr">{order.invoice_no ?? `#${order.id.slice(-6).toUpperCase()}`}</span> — {formatNumber(order.total)} {currency}</span>
          </p>
          <div>
            <label className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary block mb-1">
              {t('cancel.reason')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setShowError(false); }}
              placeholder={t('cancel.reasonPlaceholder')}
              rows={3}
              className="w-full border border-posCloud-border dark:border-posCloudDark-border rounded-lg px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-primary resize-none"
            />
            {showError && <p className="mt-1 text-xs text-posCloud-danger">{t('cancel.reasonRequired')}</p>}
          </div>
        </div>
      }
    />
  );
}

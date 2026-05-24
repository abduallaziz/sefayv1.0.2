'use client';

import { useState } from 'react';
import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { AlertTriangle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('cancelTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">{t('cancelConfirm')}</p>
              <p className="text-xs mt-1">#{order.id} — {order.total} ر.س</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              {t('cancelReason')} <span className="text-muted-foreground font-normal">{t('cancelReasonOptional')}</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('cancelReasonPlaceholder')}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {t('back')}
          </button>
          <button
            onClick={() => onConfirm(order.id, reason)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? t('cancelling') : t('confirmCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
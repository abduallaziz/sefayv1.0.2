'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelGoodsReceiptModal({ open, onClose, onConfirm, isLoading }: Props) {
  const t = useTranslations('purchasing');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-red-500">{t('cancelReceipt')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t('cancelReceiptConfirm')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? t('cancelling') : t('cancelReceipt')}
            </button>
            <button onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">
              {t('back')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

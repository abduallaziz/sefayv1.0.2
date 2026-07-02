'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelGoodsReceiptModal({ open, onClose, onConfirm, isLoading }: Props) {
  const t = useTranslations('purchasing');

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('cancelReceipt')}
      message={t('cancelReceiptConfirm')}
      confirmLabel={t('cancelReceipt')}
      cancelLabel={t('back')}
      loadingLabel={t('cancelling')}
      isLoading={isLoading}
    />
  );
}

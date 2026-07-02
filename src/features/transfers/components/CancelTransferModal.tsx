'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelTransferModal({ open, onClose, onConfirm, isLoading }: Props) {
  const t = useTranslations('transfers');

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('cancelTransfer')}
      message={t('cancelConfirm')}
      confirmLabel={t('cancelTransfer')}
      cancelLabel={t('back')}
      loadingLabel={t('cancelling')}
      isLoading={isLoading}
    />
  );
}

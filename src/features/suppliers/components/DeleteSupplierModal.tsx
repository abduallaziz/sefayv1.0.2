'use client';

import { useTranslations } from 'next-intl';
import { Supplier } from '../types/supplier.types';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  supplier: Supplier | null;
  isLoading?: boolean;
}

export function DeleteSupplierModal({ open, onClose, onConfirm, supplier, isLoading }: Props) {
  const t = useTranslations('suppliers');

  if (!supplier) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('deleteSupplier')}
      message={
        <>
          {t('deleteConfirm')} <span className="font-semibold text-slate-700 dark:text-white">{supplier.name}</span>؟
        </>
      }
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      loadingLabel={t('deleting')}
      isLoading={isLoading}
    />
  );
}

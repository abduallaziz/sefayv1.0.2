'use client';

import { useTranslations } from 'next-intl';
import { Warehouse } from '../types/warehouse.types';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warehouse: Warehouse | null;
  isLoading?: boolean;
}

export function DeleteWarehouseModal({ open, onClose, onConfirm, warehouse, isLoading }: Props) {
  const t = useTranslations('warehouses');

  if (!warehouse) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('deleteWarehouse')}
      message={
        <>
          {t('deleteConfirm')} <span className="font-semibold text-slate-700 dark:text-white">{warehouse.name}</span>؟
        </>
      }
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      loadingLabel={t('deleting')}
      isLoading={isLoading}
    />
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Item } from '../types/item.types';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: Item | null;
  isLoading?: boolean;
}

export function DeleteItemModal({ open, onClose, onConfirm, item, isLoading }: Props) {
  const t = useTranslations('items');

  if (!item) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('deleteItem')}
      message={
        <>
          {t('deleteConfirm')} <span className="font-semibold text-slate-700 dark:text-white">{item.name}</span>؟
        </>
      }
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      loadingLabel={t('deleting')}
      isLoading={isLoading}
    />
  );
}

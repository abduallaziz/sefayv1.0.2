'use client';

import { useTranslations } from 'next-intl';
import { Location } from '../types/location.types';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  location: Location | null;
  isLoading?: boolean;
}

export function DeleteLocationModal({ open, onClose, onConfirm, location, isLoading }: Props) {
  const t = useTranslations('locations');

  if (!location) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('deleteLocation')}
      message={
        <>
          {t('deleteConfirm')} <span className="font-semibold text-slate-700 dark:text-white">{location.name}</span>؟
        </>
      }
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      loadingLabel={t('deleting')}
      isLoading={isLoading}
    />
  );
}

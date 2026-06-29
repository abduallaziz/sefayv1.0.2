'use client';

import { useTranslations } from 'next-intl';
import { Customer } from '../types/customer.types';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface Props {
  customer: Customer;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCustomerModal({ customer, onClose, onConfirm, isLoading }: Props) {
  const t = useTranslations('customers');

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      title={t('delete.title')}
      message={t('delete.message', { name: customer.full_name ?? '' })}
      confirmLabel={t('delete.confirm')}
      cancelLabel={t('delete.cancel')}
      loadingLabel={t('delete.deleting')}
      isLoading={isLoading}
    />
  );
}

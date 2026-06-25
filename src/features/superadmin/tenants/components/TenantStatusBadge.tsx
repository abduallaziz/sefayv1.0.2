import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/ui/badge';
import type { TenantStatus } from '../types';

const statusVariant: Record<TenantStatus, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
  active:    'success',
  trial:     'warning',
  suspended: 'danger',
  cancelled: 'muted',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const t = useTranslations('superadmin.tenants');
  return <Badge variant={statusVariant[status]}>{t(`status.${status}`)}</Badge>;
}

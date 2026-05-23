import { Badge } from '@/shared/ui/badge';
import type { TenantStatus } from '../types';

const statusConfig: Record<TenantStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'muted' }> = {
  active:    { label: 'نشط',    variant: 'success' },
  trial:     { label: 'تجريبي', variant: 'warning' },
  suspended: { label: 'موقوف',  variant: 'danger'  },
  cancelled: { label: 'ملغي',   variant: 'muted'   },
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
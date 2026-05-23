'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import type { Tenant } from '../types';
import { TenantStatusBadge } from './TenantStatusBadge';
import { TenantActionsDropdown } from './TenantActionsDropdown';
import { Users, GitBranch } from 'lucide-react';

interface Props {
  tenants: Tenant[];
  isLoading: boolean;
}

export function TenantsTable({ tenants, isLoading }: Props) {
  const t = useTranslations('tenants')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-[#1e2130] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tenants.length) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        {t('noResults')}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1e2130] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#141720] text-muted-foreground text-right">
            <th className="px-4 py-3 font-medium">{t('col.name')}</th>
            <th className="px-4 py-3 font-medium">{t('col.businessType')}</th>
            <th className="px-4 py-3 font-medium">{t('col.status')}</th>
            <th className="px-4 py-3 font-medium">{t('col.plan')}</th>
            <th className="px-4 py-3 font-medium">{t('col.branches')}</th>
            <th className="px-4 py-3 font-medium">{t('col.users')}</th>
            <th className="px-4 py-3 font-medium">{t('col.createdAt')}</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2130]">
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="bg-[#0f1117] hover:bg-[#141720] transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-white">{tenant.name}</div>
                {tenant.owner_email && (
                  <div className="text-xs text-muted-foreground">{tenant.owner_email}</div>
                )}
                {tenant.deleted_at && (
                  <span className="text-xs text-red-500">({t('deleted')})</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{tenant.business_type}</td>
              <td className="px-4 py-3"><TenantStatusBadge status={tenant.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{tenant.subscription_plan ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <GitBranch className="w-3 h-3" />{tenant.branches_count ?? 0}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />{tenant.users_count ?? 0}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {format(new Date(tenant.created_at), 'dd/MM/yyyy')}
              </td>
              <td className="px-4 py-3"><TenantActionsDropdown tenant={tenant} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
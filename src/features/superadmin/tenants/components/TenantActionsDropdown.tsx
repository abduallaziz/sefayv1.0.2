'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/ui/dropdown';
import { Button } from '@/shared/ui/button';
import { MoreHorizontal, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import type { Tenant } from '../types';
import { useActivateTenant, useDeactivateTenant, useSoftDeleteTenant } from '../hooks';
import { ExtendTrialDialog } from './ExtendTrialDialog';

interface Props { tenant: Tenant }

export function TenantActionsDropdown({ tenant }: Props) {
  const t = useTranslations('tenants')
  const [extendOpen, setExtendOpen] = useState(false);
  const activate = useActivateTenant();
  const deactivate = useDeactivateTenant();
  const softDelete = useSoftDeleteTenant();
  const isDeleted = !!tenant.deleted_at;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {tenant.status !== 'active' && (
            <DropdownMenuItem onClick={() => activate.mutate(tenant.id)} className="text-green-500">
              <CheckCircle className="w-4 h-4" />{t('activate')}
            </DropdownMenuItem>
          )}
          {tenant.status === 'active' && (
            <DropdownMenuItem onClick={() => deactivate.mutate(tenant.id)} className="text-yellow-500">
              <XCircle className="w-4 h-4" />{t('deactivate')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setExtendOpen(true)}>
            <Clock className="w-4 h-4" />{t('extendTrial')}
          </DropdownMenuItem>
          {!isDeleted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => softDelete.mutate(tenant.id)} className="text-red-500">
                <Trash2 className="w-4 h-4" />{t('delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ExtendTrialDialog tenantId={tenant.id} tenantName={tenant.name} open={extendOpen} onClose={() => setExtendOpen(false)} />
    </>
  );
}
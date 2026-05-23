'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useExtendTrial } from '../hooks';

interface Props {
  tenantId: string;
  tenantName: string;
  open: boolean;
  onClose: () => void;
}

export function ExtendTrialDialog({ tenantId, tenantName, open, onClose }: Props) {
  const t = useTranslations('tenants')
  const [days, setDays] = useState('14');
  const { mutate, isPending } = useExtendTrial();

  const handleConfirm = () => {
    mutate({ id: tenantId, days: Number(days) }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('extendTrial')} — {tenantName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('extendDays')}</p>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} min={1} max={365} />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={handleConfirm} disabled={isPending || !days || Number(days) < 1}>
            {isPending ? t('extending') : t('confirmExtend')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
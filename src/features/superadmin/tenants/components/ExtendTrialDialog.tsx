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
      <DialogContent className="bg-white dark:bg-[#1a1f2e] border-slate-200 dark:border-[#1e2130]">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-white">{t('extendTrial')} — {tenantName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-sm text-slate-500 dark:text-muted-foreground">{t('extendDays')}</p>
          <Input
            type="text"
            inputMode="numeric"
            lang="en"
            dir="ltr"
            value={days}
            onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*$/.test(v)) setDays(v); }}
            className="bg-slate-50 dark:bg-[#141720] border-slate-200 dark:border-[#1e2130] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 dark:border-[#1e2130] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#242938]"
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || !days || Number(days) < 1}>
            {isPending ? t('extending') : t('confirmExtend')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
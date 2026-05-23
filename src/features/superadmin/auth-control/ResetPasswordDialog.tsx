'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type { TenantUser } from './types';

const schema = z.object({
  newPassword: z.string().min(8),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

interface Props {
  user: TenantUser | null;
  onClose: () => void;
  onSubmit: (userId: string, newPassword: string) => Promise<void>;
}

export function ResetPasswordDialog({ user, onClose, onSubmit }: Props) {
  const t = useTranslations('authControl')
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleClose = () => { reset(); onClose(); };

  const onFormSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try { await onSubmit(user.id, data.newPassword); handleClose(); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={!!user} onOpenChange={handleClose}>
      <DialogContent className="bg-[#141720] border-[#1e2130] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{t('resetPassword')}</DialogTitle>
          {user && <p className="text-sm text-gray-400">{user.name} — {user.email}</p>}
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('newPassword')}</label>
            <Input type="password" placeholder={t('passwordPlaceholder')} className="bg-[#0f1117] border-[#1e2130] text-white" {...register('newPassword')} />
            {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('confirmPassword')}</label>
            <Input type="password" placeholder={t('confirmPlaceholder')} className="bg-[#0f1117] border-[#1e2130] text-white" {...register('confirm')} />
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? t('saving') : t('resetPassword')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
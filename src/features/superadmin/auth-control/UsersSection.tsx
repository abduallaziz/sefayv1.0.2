'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import type { TenantUser } from './types';

const ROLES = ['owner', 'manager', 'cashier', 'worker'] as const;

interface Props {
  users: TenantUser[];
  onResetPassword: (userId: string, newPassword: string) => Promise<void>;
  onChangeRole: (userId: string, role: TenantUser['role']) => void;
  onToggleActive: (userId: string, is_active: boolean) => void;
  onRevokeAll: (userId: string) => void;
}

export function UsersSection({ users, onResetPassword, onChangeRole, onToggleActive, onRevokeAll }: Props) {
  const t = useTranslations('authControl')
  const [resetTarget, setResetTarget] = useState<TenantUser | null>(null);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2130] text-gray-400">
              <th className="text-left py-3 px-4">{t('user')}</th>
              <th className="text-left py-3 px-4">{t('role')}</th>
              <th className="text-left py-3 px-4">{t('status')}</th>
              <th className="text-left py-3 px-4">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-[#1e2130] hover:bg-white/5">
                <td className="py-3 px-4">
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-gray-400 text-xs">{user.email}</div>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={user.role}
                    onChange={e => onChangeRole(user.id, e.target.value as TenantUser['role'])}
                    className="bg-[#0f1117] border border-[#1e2130] text-white rounded px-2 py-1 text-xs"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onToggleActive(user.id, !user.is_active)}
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      user.is_active
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    {user.is_active ? t('active') : t('inactive')}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost"
                      className="text-xs text-gray-300 hover:text-white border border-[#1e2130]"
                      onClick={() => setResetTarget(user)}>
                      {t('resetPassword')}
                    </Button>
                    <Button size="sm" variant="ghost"
                      className="text-xs text-orange-400 hover:text-orange-300 border border-[#1e2130]"
                      onClick={() => onRevokeAll(user.id)}>
                      {t('revokeAll')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} onSubmit={onResetPassword} />
    </div>
  );
}
'use client';

import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/shared/ui/button';
import type { DeviceSession } from './types';

interface Props {
  sessions: DeviceSession[];
  onRevoke: (sessionId: string) => void;
}

export function SessionsSection({ sessions, onRevoke }: Props) {
  const t = useTranslations('authControl')

  const active = sessions.filter(s => !s.is_revoked);
  const revoked = sessions.filter(s => s.is_revoked);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        {active.length} {t('active')} · {revoked.length} {t('revoked')}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2130] text-gray-400">
              <th className="text-left py-3 px-4">{t('user')}</th>
              <th className="text-left py-3 px-4">{t('tenant')}</th>
              <th className="text-left py-3 px-4">{t('device')}</th>
              <th className="text-left py-3 px-4">{t('ip')}</th>
              <th className="text-left py-3 px-4">{t('lastActive')}</th>
              <th className="text-left py-3 px-4">{t('status')}</th>
              <th className="text-left py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id} className={`border-b border-[#1e2130] hover:bg-white/5 ${session.is_revoked ? 'opacity-50' : ''}`}>
                <td className="py-3 px-4">
                  <div className="font-medium text-white">{session.user_name}</div>
                  <div className="text-gray-400 text-xs">{session.user_email}</div>
                </td>
                <td className="py-3 px-4 text-gray-300">{session.tenant_name}</td>
                <td className="py-3 px-4">
                  <div className="text-gray-300">{session.device_name}</div>
                  <div className="text-xs text-gray-500">{session.device_type}</div>
                </td>
                <td className="py-3 px-4 text-gray-400 font-mono text-xs">{session.ip_address}</td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded ${session.is_revoked ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {session.is_revoked ? t('revoked') : t('active')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {!session.is_revoked && (
                    <Button size="sm" variant="ghost"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => onRevoke(session.id)}>
                      {t('revoke')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
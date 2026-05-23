'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthControl } from '@/features/superadmin/auth-control/hooks';
import { UsersSection } from '@/features/superadmin/auth-control/UsersSection';
import { SessionsSection } from '@/features/superadmin/auth-control/SessionsSection';

type Tab = 'users' | 'sessions';

export default function AuthControlPage() {
  const t = useTranslations('authControl')
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const {
    tenantsQuery,
    useTenantUsers,
    useSessionsQuery,
    resetPasswordMutation,
    changeRoleMutation,
    toggleActiveMutation,
    revokeSessionMutation,
    revokeAllMutation,
  } = useAuthControl();

  const usersQuery = useTenantUsers(selectedTenantId);
  const sessionsQuery = useSessionsQuery(selectedTenantId || undefined);

  const tenants = tenantsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Tenant Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400 shrink-0">{t('tenant')}:</label>
        <select
          value={selectedTenantId}
          onChange={e => setSelectedTenantId(e.target.value)}
          className="bg-[#141720] border border-[#1e2130] text-white rounded-lg px-3 py-2 text-sm min-w-[220px]"
        >
          <option value="">{t('allTenants')}</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e2130]">
        {(['users', 'sessions'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t(tab)}
            {tab === 'users' && selectedTenantId && (
              <span className="ml-1.5 text-xs bg-[#1e2130] text-gray-400 px-1.5 py-0.5 rounded">
                {users.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
        {activeTab === 'users' && (
          <>
            {!selectedTenantId ? (
              <div className="p-8 text-center text-gray-500">{t('selectTenant')}</div>
            ) : usersQuery.isLoading ? (
              <div className="p-8 text-center text-gray-500">{t('loading')}</div>
            ) : (
              <UsersSection
                users={users}
                onResetPassword={(userId, newPassword) =>
                  resetPasswordMutation.mutateAsync({ userId, newPassword })
                }
                onChangeRole={(userId, role) =>
                  changeRoleMutation.mutate({ userId, role })
                }
                onToggleActive={(userId, is_active) =>
                  toggleActiveMutation.mutate({ userId, is_active })
                }
                onRevokeAll={userId => revokeAllMutation.mutate(userId)}
              />
            )}
          </>
        )}

        {activeTab === 'sessions' && (
          <>
            {sessionsQuery.isLoading ? (
              <div className="p-8 text-center text-gray-500">{t('loading')}</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('noSessions')}</div>
            ) : (
              <SessionsSection
                sessions={sessions}
                onRevoke={sessionId => revokeSessionMutation.mutate(sessionId)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
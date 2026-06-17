'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useUsers, useDeleteUser } from '../hooks/useUsers'
import { CreateUserDialog } from '../components/CreateUserDialog'
import { Trash2, Plus } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  manager: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  cashier: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  worker: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

export function UsersPage() {
  const t = useTranslations('users')
  const { data: users, isLoading } = useUsers()
  const { mutate: deleteUser } = useDeleteUser()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <CreateUserDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('count', { count: users?.length ?? 0 })}
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addUser')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('name')}</th>
                <th className="hidden sm:table-cell text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('email')}</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('role')}</th>
                <th className="hidden sm:table-cell text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                          {user.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white truncate">{user.name}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[user.role] ?? 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {user.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{t('empty')}</div>
          )}
        </div>
      )}
    </div>
  )
}
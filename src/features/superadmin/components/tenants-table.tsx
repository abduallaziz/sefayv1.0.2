'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Search, MoreHorizontal, CheckCircle, XCircle, Clock, Ban } from 'lucide-react'
import { Badge, Button } from '@/shared/ui'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/shared/ui'
import type { Tenant, TenantStatus } from '../types'

interface TenantsTableProps {
  tenants: Tenant[]
  onActivate: (id: string) => void
  onDeactivate: (id: string) => void
  onExtendTrial: (id: string) => void
}

export function TenantsTable({ tenants, onActivate, onDeactivate, onExtendTrial }: TenantsTableProps) {
  const t = useTranslations('tenants')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all')

  const statusConfig: Record<TenantStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'muted'; icon: React.ReactNode }> = {
    active:    { label: t('active'),    variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
    trial:     { label: t('trial'),     variant: 'warning', icon: <Clock className="h-3 w-3" /> },
    suspended: { label: t('suspended'), variant: 'danger',  icon: <Ban className="h-3 w-3" /> },
    cancelled: { label: t('cancelled'), variant: 'muted',   icon: <XCircle className="h-3 w-3" /> },
  }

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-lg border border-slate-200 dark:border-[#1e2130] bg-white dark:bg-[#1a1f2e]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2130] p-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">{t('title')}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#141720] px-3 py-2 w-56">
            <Search className="h-4 w-4 text-slate-400 dark:text-[#64748b]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'active', 'trial', 'suspended', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                  statusFilter === s ? 'bg-[#6366f1]/20 text-[#6366f1] dark:text-[#818cf8]' : 'text-slate-400 dark:text-[#64748b] hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                {s === 'all' ? t('allStatus') : t(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1e2130]">
              {[t('col.name'), t('col.businessType'), t('col.status'), t('col.users'), t('col.branches'), 'MRR', t('col.createdAt'), t('common_actions')].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-[#64748b]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#1e2130]">
            {filtered.map((tenant, i) => {
              const status = statusConfig[tenant.status]
              return (
                <motion.tr
                  key={tenant.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-[#242938] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/20 text-xs font-bold text-[#6366f1] dark:text-[#818cf8]">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 dark:text-[#64748b] capitalize">{tenant.business_type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant} className="flex w-fit items-center gap-1">
                      {status.icon}{status.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 dark:text-[#64748b]">{tenant.users_count ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 dark:text-[#64748b]">{tenant.branches_count ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-white font-medium">
                    {tenant.mrr ? `$${tenant.mrr.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 dark:text-[#64748b]">{tenant.created_at}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('col.actions') ?? 'Actions'}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onActivate(tenant.id)}>{t('activate')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeactivate(tenant.id)}>{t('deactivate')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExtendTrial(tenant.id)}>{t('extendTrial')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-[#64748b]">
            {t('noResults')}
          </div>
        )}
      </div>
    </motion.div>
  )
}
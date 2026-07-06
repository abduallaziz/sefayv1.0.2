'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowRight, Mail, Briefcase, Building2, Clock, CalendarDays, Wallet } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { useAllAttendance, useLeaveRequests } from '@/features/hr/hooks/useHr'
import { usePayrollReport } from '@/features/reports/hooks/useReports'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { formatNumber } from '@/lib/format'

function currentMonth() {
  return new Date().toISOString().substring(0, 7)
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function EmployeeDetailPage({ userId }: { userId: string }) {
  const t = useTranslations('employeeDetail')
  const currency = useTenantStore((s) => s.currency_symbol)
  const month = currentMonth()

  const { data: users = [], isLoading: usersLoading } = useUsers()
  const user = users.find((u) => u.id === userId)

  const monthStart = `${month}-01`
  const monthEnd = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().substring(0, 10)

  const { data: attendance = [] } = useAllAttendance({ userId, from: monthStart, to: monthEnd })
  const { data: leaves = [] } = useLeaveRequests(undefined, userId)
  const { data: payroll } = usePayrollReport(month)

  const attendanceSummary = useMemo(() => {
    const workDays = new Set(attendance.map((a) => a.check_in_at.substring(0, 10))).size
    const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked ?? 0), 0)
    return { workDays, totalHours: Math.round(totalHours * 100) / 100 }
  }, [attendance])

  const leaveSummary = useMemo(() => ({
    pending: leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  }), [leaves])

  const payrollRow = payroll?.employees.find((e) => e.user_id === userId)

  if (usersLoading) {
    return <div className="h-40 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
  }

  if (!user) {
    return <p className="text-sm text-slate-400 text-center py-10">{t('notFound')}</p>
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/users" className="inline-flex items-center gap-1.5 text-sm text-[#0C447C] dark:text-[#5B9BD5] hover:underline">
        <ArrowRight className="w-4 h-4 rotate-180" />
        {t('back')}
      </Link>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#0C447C] flex items-center justify-center text-white text-lg font-semibold">
              {initials(user.name)}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">{user.name}</h1>
            {user.job_title && <p className="text-sm text-slate-500">{user.job_title}</p>}
          </div>
          <span className={`ms-auto px-2.5 py-1 rounded-full text-xs font-semibold ${
            user.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
          }`}>
            {user.is_active ? t('active') : t('inactive')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-gray-800">
          <InfoItem icon={Mail} label={t('email')} value={user.email} />
          <InfoItem icon={Briefcase} label={t('role')} value={user.role} />
          <InfoItem icon={Building2} label={t('department')} value={user.department ?? '—'} />
          <InfoItem icon={Briefcase} label={t('jobTitle')} value={user.job_title ?? '—'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
          <SectionTitle icon={Clock} title={t('attendanceSummary')} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Stat label={t('workDays')} value={attendanceSummary.workDays} />
            <Stat label={t('totalHours')} value={attendanceSummary.totalHours} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
          <SectionTitle icon={CalendarDays} title={t('leaveSummary')} />
          {leaves.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">{t('noLeaves')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Stat label={t('pending')} value={leaveSummary.pending} tone="amber" />
              <Stat label={t('approved')} value={leaveSummary.approved} tone="emerald" />
              <Stat label={t('rejected')} value={leaveSummary.rejected} tone="red" />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
          <SectionTitle icon={Wallet} title={t('payrollSummary')} />
          {!payrollRow ? (
            <p className="text-xs text-slate-400 text-center py-4">{t('notOnPayroll')}</p>
          ) : (
            <div className="space-y-1.5 mt-3 text-xs">
              <Row label={t('baseSalary')} value={`${formatNumber(payrollRow.base_salary)} ${currency}`} />
              <Row label={t('absenceDeduction')} value={`-${formatNumber(payrollRow.absence_deduction)} ${currency}`} muted />
              <Row label={t('lateDeduction')} value={`-${formatNumber(payrollRow.late_deduction)} ${currency}`} muted />
              <Row label={t('leaveDeduction')} value={`-${formatNumber(payrollRow.leave_deduction)} ${currency}`} muted />
              <Row label={t('netSalary')} value={`${formatNumber(payrollRow.net_salary)} ${currency}`} strong />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{value}</p>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400" />
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'amber' | 'emerald' | 'red' }) {
  const toneClass = tone === 'amber' ? 'text-amber-600 dark:text-amber-400'
    : tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'red' ? 'text-red-600 dark:text-red-400'
    : 'text-slate-800 dark:text-white'
  return (
    <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3 text-center">
      <p className={`text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={muted ? 'text-slate-400' : strong ? 'font-semibold text-slate-800 dark:text-white text-sm' : 'text-slate-700 dark:text-slate-300'}>{value}</span>
    </div>
  )
}

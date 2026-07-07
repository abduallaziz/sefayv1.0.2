'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ArrowRight, Mail, Briefcase, Building2, Clock, CalendarDays, Wallet, Phone, MapPin,
  User as UserIcon, ShieldCheck, Smartphone, History as HistoryIcon,
} from 'lucide-react'
import { useUsers, useGenerateAttendanceLink, useUnbindAttendanceDevice, useEmployeeHistory } from '../hooks/useUsers'
import { useAllAttendance, useLeaveRequests } from '@/features/hr/hooks/useHr'
import { usePayrollReport } from '@/features/reports/hooks/useReports'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { formatNumber } from '@/lib/format'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

type Tab = 'overview' | 'job' | 'attendance' | 'history'

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
  const [tab, setTab] = useState<Tab>('overview')

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
    const last = [...attendance].sort((a, b) => (a.check_in_at < b.check_in_at ? 1 : -1))[0]
    return { workDays, totalHours: Math.round(totalHours * 100) / 100, last }
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

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: t('tabOverview'), icon: UserIcon },
    { key: 'job', label: t('tabJobInfo'), icon: Briefcase },
    { key: 'attendance', label: t('tabAttendance'), icon: ShieldCheck },
    { key: 'history', label: t('tabHistory'), icon: HistoryIcon },
  ]

  return (
    <div className="space-y-6">
      <Link href="/dashboard/employees" className="inline-flex items-center gap-1.5 text-sm text-[#0C447C] dark:text-[#5B9BD5] hover:underline">
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
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[20px] shadow-sm p-6">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-gray-800 pb-5">
          {tabs.map((tItem) => (
            <button
              key={tItem.key}
              onClick={() => setTab(tItem.key)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === tItem.key
                  ? 'bg-[#0C447C] text-white'
                  : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              <tItem.icon className="w-3.5 h-3.5" />
              {tItem.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'overview' && (
            <OverviewTab t={t} user={user} leaveSummary={leaveSummary} leaves={leaves} payrollRow={payrollRow} currency={currency} />
          )}
          {tab === 'job' && <JobInfoTab t={t} user={user} />}
          {tab === 'attendance' && <AttendanceTab t={t} user={user} attendanceSummary={attendanceSummary} />}
          {tab === 'history' && <HistoryTab t={t} userId={userId} />}
        </div>
      </div>
    </div>
  )
}

/* ── Shared ── */
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

/* ── Overview tab ── */
function OverviewTab({
  t, user, leaveSummary, leaves, payrollRow, currency,
}: {
  t: ReturnType<typeof useTranslations>
  user: any
  leaveSummary: { pending: number; approved: number; rejected: number }
  leaves: any[]
  payrollRow: any
  currency: string
}) {
  return (
    <div className="space-y-4">
      <div className="border border-slate-100 dark:border-gray-800 rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoItem icon={UserIcon} label={t('employeeNumber')} value={user.employee_number ?? t('notSet')} />
          <InfoItem icon={Building2} label={t('department')} value={user.department ?? t('notSet')} />
          <InfoItem icon={Briefcase} label={t('jobTitle')} value={user.job_title ?? t('notSet')} />
          <InfoItem icon={MapPin} label={t('location')} value={user.city ?? t('notSet')} />
          <InfoItem icon={Mail} label={t('email')} value={user.email ?? t('notSet')} />
          <InfoItem icon={Phone} label={t('phone')} value={user.phone ?? t('notSet')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-5">
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

        <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <SectionTitle icon={Wallet} title={t('payrollSummary')} />
          {!payrollRow ? (
            <p className="text-xs text-slate-400 text-center py-4">{t('notOnPayroll')}</p>
          ) : (
            <div className="space-y-1.5 mt-3 text-xs">
              <Row label={t('baseSalary')} value={`${formatNumber(payrollRow.base_salary)} ${currency}`} />
              <Row label={t('netSalary')} value={`${formatNumber(payrollRow.net_salary)} ${currency}`} strong />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Job Information tab ── */
function JobInfoTab({ t, user }: { t: ReturnType<typeof useTranslations>; user: any }) {
  const employmentTypeLabel = user.employment_type === 'full_time' ? t('employmentTypeFullTime')
    : user.employment_type === 'part_time' ? t('employmentTypePartTime')
    : t('notSet')

  return (
    <div className="border border-slate-100 dark:border-gray-800 rounded-2xl p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <InfoItem icon={Building2} label={t('department')} value={user.department ?? t('notSet')} />
        <InfoItem icon={Briefcase} label={t('jobTitle')} value={user.job_title ?? t('notSet')} />
        <InfoItem icon={Clock} label={t('employmentType')} value={employmentTypeLabel} />
        <InfoItem icon={UserIcon} label={t('manager')} value={user.manager_name ?? t('notSet')} />
        <InfoItem icon={CalendarDays} label={t('joinDate')} value={user.join_date ?? t('notSet')} />
        <InfoItem icon={MapPin} label={t('location')} value={user.city ?? t('notSet')} />
      </div>
    </div>
  )
}

/* ── Attendance tab ── */
function AttendanceTab({
  t, user, attendanceSummary,
}: {
  t: ReturnType<typeof useTranslations>
  user: any
  attendanceSummary: { workDays: number; totalHours: number; last?: { check_in_at: string } }
}) {
  const { mutate: generateLink, isPending: generating } = useGenerateAttendanceLink()
  const { mutate: unbindDevice, isPending: unbinding } = useUnbindAttendanceDevice()
  const [confirmType, setConfirmType] = useState<'enable' | 'regenerate' | 'reset' | null>(null)

  function handleConfirm() {
    if (confirmType === 'enable' || confirmType === 'regenerate') {
      generateLink(user.id, { onSuccess: () => setConfirmType(null) })
    } else if (confirmType === 'reset') {
      unbindDevice(user.id, { onSuccess: () => setConfirmType(null) })
    }
  }

  const confirmCopy: Record<string, { title: string; message: string; label: string }> = {
    enable: { title: t('enableAttendance'), message: t('confirmEnableAttendance'), label: t('confirm') },
    regenerate: { title: t('regenerateLink'), message: t('confirmRegenerateLink'), label: t('confirm') },
    reset: { title: t('resetDevice'), message: t('confirmResetDevice'), label: t('confirm') },
  }

  if (!user.attendance_enabled) {
    return (
      <div className="border border-slate-100 dark:border-gray-800 rounded-2xl p-8 text-center">
        <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('attendanceDisabledTitle')}</h3>
        <p className="text-xs text-slate-400 mb-4">{t('attendanceDisabledDesc')}</p>
        <button
          onClick={() => setConfirmType('enable')}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0C447C] hover:bg-[#0a3a6b] transition-colors"
        >
          {t('enableAttendance')}
        </button>

        <ConfirmDialog
          open={!!confirmType}
          onClose={() => setConfirmType(null)}
          onConfirm={handleConfirm}
          variant="warning"
          title={confirmType ? confirmCopy[confirmType].title : ''}
          message={confirmType ? confirmCopy[confirmType].message : ''}
          confirmLabel={confirmType ? confirmCopy[confirmType].label : ''}
          cancelLabel={t('cancel')}
          loadingLabel={t('processing')}
          isLoading={generating}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border border-slate-100 dark:border-gray-800 rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoItem icon={ShieldCheck} label={t('attendanceStatus')} value={t('enableAttendance')} />
          <InfoItem icon={ShieldCheck} label={t('tokenStatus')} value={user.attendance_token ? t('tokenActive') : t('notSet')} />
          <InfoItem icon={Smartphone} label={t('deviceStatus')} value={user.attendance_device_fingerprint ? t('deviceBound') : t('deviceNotBound')} />
          <InfoItem
            icon={Clock}
            label={t('lastAttendance')}
            value={attendanceSummary.last ? new Date(attendanceSummary.last.check_in_at).toLocaleString('en-US') : t('noAttendanceYet')}
          />
          <InfoItem icon={CalendarDays} label={t('workDays')} value={String(attendanceSummary.workDays)} />
          <InfoItem icon={Clock} label={t('totalHours')} value={String(attendanceSummary.totalHours)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setConfirmType('regenerate')}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t('regenerateLink')}
        </button>
        <button
          onClick={() => setConfirmType('reset')}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t('resetDevice')}
        </button>
      </div>

      <ConfirmDialog
        open={!!confirmType}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirm}
        variant="warning"
        title={confirmType ? confirmCopy[confirmType].title : ''}
        message={confirmType ? confirmCopy[confirmType].message : ''}
        confirmLabel={confirmType ? confirmCopy[confirmType].label : ''}
        cancelLabel={t('cancel')}
        loadingLabel={t('processing')}
        isLoading={generating || unbinding}
      />
    </div>
  )
}

/* ── History tab ── */
function HistoryTab({ t, userId }: { t: ReturnType<typeof useTranslations>; userId: string }) {
  const { data: history = [], isLoading } = useEmployeeHistory(userId)

  if (isLoading) {
    return <div className="h-24 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
  }

  if (history.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">{t('historyEmpty')}</p>
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 border border-slate-100 dark:border-gray-800 rounded-xl p-3">
          <HistoryIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{entry.action}</p>
            <p className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString('en-US')}</p>
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-400 text-center pt-2">{t('historyNote')}</p>
    </div>
  )
}

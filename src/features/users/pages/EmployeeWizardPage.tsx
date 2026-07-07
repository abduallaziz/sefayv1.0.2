'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useCreateEmployee } from '../hooks/useUsers'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import type { CreateEmployeeDto } from '../api/users.api'

type Step = 1 | 2 | 3 | 4 | 5

interface WizardData {
  name: string
  employee_number: string
  email: string
  phone: string
  identity_number: string
  department: string
  job_title: string
  employment_type: '' | 'full_time' | 'part_time'
  join_date: string | undefined
  manager_name: string
  city: string
  address: string
  gps_radius_meters: string
  enable_attendance: boolean
}

const INITIAL_DATA: WizardData = {
  name: '',
  employee_number: '',
  email: '',
  phone: '',
  identity_number: '',
  department: '',
  job_title: '',
  employment_type: '',
  join_date: undefined,
  manager_name: '',
  city: '',
  address: '',
  gps_radius_meters: '',
  enable_attendance: false,
}

function initials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function EmployeeWizardPage() {
  const t = useTranslations('employeeWizard')
  const router = useRouter()
  const { mutate: createEmployee, isPending } = useCreateEmployee()

  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const steps: { key: Step; label: string }[] = [
    { key: 1, label: t('step1') },
    { key: 2, label: t('step2') },
    { key: 3, label: t('step3') },
    { key: 4, label: t('step4') },
    { key: 5, label: t('step5') },
  ]

  const stepSubtitle = t(`stepSubtitle${step}` as 'stepSubtitle1')

  const canGoNext = step !== 1 || data.name.trim().length > 0

  function goNext() {
    if (step === 1 && !data.name.trim()) {
      setError(t('nameRequired'))
      return
    }
    setError(null)
    if (step < 5) setStep((s) => (s + 1) as Step)
  }

  function goPrev() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  function handleSubmit() {
    if (!data.name.trim()) {
      setStep(1)
      setError(t('nameRequired'))
      return
    }
    setError(null)

    const dto: CreateEmployeeDto = {
      name: data.name.trim(),
      employee_number: data.employee_number || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      identity_number: data.identity_number || undefined,
      department: data.department || undefined,
      job_title: data.job_title || undefined,
      employment_type: data.employment_type || undefined,
      join_date: data.join_date || undefined,
      manager_name: data.manager_name || undefined,
      city: data.city || undefined,
      address: data.address || undefined,
      gps_radius_meters: data.gps_radius_meters ? Number(data.gps_radius_meters) : undefined,
      enable_attendance: data.enable_attendance,
    }

    createEmployee(dto, {
      onSuccess: (created) => {
        router.push(`/dashboard/users/${created.id}`)
      },
      onError: (err: any) => {
        setError(err?.message || t('createError'))
      },
    })
  }

  const primaryFooterAction = useMemo(() => {
    if (step === 5) return { label: isPending ? t('creating') : t('createEmployee'), onClick: handleSubmit }
    const nextLabels: Record<Step, string> = { 1: t('nextJob'), 2: t('nextLocation'), 3: t('nextAttendance'), 4: t('nextReview'), 5: t('createEmployee') }
    return { label: nextLabels[step], onClick: goNext }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isPending, data])

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stepSubtitle}</p>
        </div>
        <button
          onClick={primaryFooterAction.onClick}
          disabled={isPending}
          className="px-5 py-3 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors shrink-0"
        >
          {step === 5 ? primaryFooterAction.label : t('save')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] shadow-[0_8px_25px_rgba(20,33,61,0.06)] p-6 mt-6">
        <div className="flex flex-wrap gap-3 border-b border-gray-100 dark:border-gray-800 pb-5">
          {steps.map((s) => (
            <div
              key={s.key}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                s.key === step
                  ? 'bg-[#0C447C] text-white'
                  : s.key < step
                    ? 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-6">
          <div>
            {step === 1 && <BasicInfoStep t={t} data={data} set={set} />}
            {step === 2 && <JobInfoStep t={t} data={data} set={set} />}
            {step === 3 && <LocationStep t={t} data={data} set={set} />}
            {step === 4 && <AttendanceStep t={t} data={data} set={set} />}
            {step === 5 && <ReviewStep t={t} data={data} />}

            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          </div>

          <SummaryCard t={t} data={data} step={step} />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goPrev}
            disabled={step === 1}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {t('previous')}
          </button>
          <button
            onClick={primaryFooterAction.onClick}
            disabled={!canGoNext || isPending}
            className="px-6 py-3 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {primaryFooterAction.label}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Shared field styling ── */
const inputClass = 'w-full p-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white'
const labelClass = 'block text-sm mb-2 text-gray-600 dark:text-gray-300'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

/* ── Step 1: Basic Information ── */
function BasicInfoStep({ t, data, set }: { t: ReturnType<typeof useTranslations>; data: WizardData; set: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('basicInfoTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('fullName')}>
          <input className={inputClass} value={data.name} onChange={(e) => set('name', e.target.value)} placeholder={t('fullNamePlaceholder')} />
        </Field>
        <Field label={t('employeeNumber')}>
          <input className={inputClass} value={data.employee_number} onChange={(e) => set('employee_number', e.target.value)} placeholder={t('employeeNumberPlaceholder')} />
        </Field>
        <Field label={t('email')}>
          <input type="email" className={inputClass} value={data.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label={t('phone')}>
          <input className={inputClass} value={data.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label={t('identityNumber')}>
          <input className={inputClass} value={data.identity_number} onChange={(e) => set('identity_number', e.target.value)} />
        </Field>
        <Field label={t('status')}>
          <select className={inputClass} disabled value="active">
            <option value="active">{t('statusActive')}</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

/* ── Step 2: Job Information ── */
function JobInfoStep({ t, data, set }: { t: ReturnType<typeof useTranslations>; data: WizardData; set: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('jobInfoTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('department')}>
          <input className={inputClass} value={data.department} onChange={(e) => set('department', e.target.value)} placeholder={t('departmentPlaceholder')} />
        </Field>
        <Field label={t('jobTitle')}>
          <input className={inputClass} value={data.job_title} onChange={(e) => set('job_title', e.target.value)} placeholder={t('jobTitlePlaceholder')} />
        </Field>
        <Field label={t('employmentType')}>
          <select className={inputClass} value={data.employment_type} onChange={(e) => set('employment_type', e.target.value as WizardData['employment_type'])}>
            <option value="full_time">{t('employmentTypeFullTime')}</option>
            <option value="part_time">{t('employmentTypePartTime')}</option>
          </select>
        </Field>
        <Field label={t('joinDate')}>
          <SingleDatePicker value={data.join_date} onChange={(v) => set('join_date', v)} />
        </Field>
        <Field label={t('managerName')}>
          <input className={inputClass} value={data.manager_name} onChange={(e) => set('manager_name', e.target.value)} placeholder={t('managerNamePlaceholder')} />
        </Field>
      </div>
    </div>
  )
}

/* ── Step 3: Location ── */
function LocationStep({ t, data, set }: { t: ReturnType<typeof useTranslations>; data: WizardData; set: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('locationInfoTitle')}</h2>
      <div className="h-[180px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-5">
        {t('mapPlaceholder')}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('branch')}>
          <select className={inputClass} disabled defaultValue="main">
            <option value="main">{t('mainBranch')}</option>
          </select>
        </Field>
        <Field label={t('city')}>
          <input className={inputClass} value={data.city} onChange={(e) => set('city', e.target.value)} placeholder={t('cityPlaceholder')} />
        </Field>
        <Field label={t('address')}>
          <input className={inputClass} value={data.address} onChange={(e) => set('address', e.target.value)} placeholder={t('addressPlaceholder')} />
        </Field>
        <Field label={t('gpsRadius')}>
          <input
            type="number"
            className={inputClass}
            value={data.gps_radius_meters}
            onChange={(e) => set('gps_radius_meters', e.target.value)}
            placeholder={t('gpsRadiusPlaceholder')}
          />
        </Field>
      </div>
    </div>
  )
}

/* ── Step 4: Attendance ── */
function AttendanceStep({ t, data, set }: { t: ReturnType<typeof useTranslations>; data: WizardData; set: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('attendanceActivationTitle')}</h2>

      <div className="bg-[#0C447C]/5 border border-[#0C447C]/15 rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{t('attendanceProfileTitle')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('attendanceProfileDesc')}</p>
        <span className={`inline-block px-4 py-2 rounded-full text-xs font-semibold ${data.enable_attendance ? 'bg-emerald-600 text-white' : 'bg-gray-400 text-white'}`}>
          {data.enable_attendance ? t('attendanceEnabled') : t('attendanceNotEnabled')}
        </span>
      </div>

      <div className="bg-[#0C447C]/5 border border-[#0C447C]/15 rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{t('attendanceLinkTitle')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('attendanceLinkDesc')}</p>
        <button
          onClick={() => set('enable_attendance', !data.enable_attendance)}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${data.enable_attendance ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0C447C] hover:bg-[#0a3a6b]'}`}
        >
          {data.enable_attendance ? t('attendanceEnabled') : t('enableAttendance')}
        </button>
      </div>

      <div className="bg-[#0C447C]/5 border border-[#0C447C]/15 rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{t('deviceSettingsTitle')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('deviceSettingsDesc')}</p>
        <button disabled title={t('resetDeviceUnavailable')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0C447C] opacity-40 cursor-not-allowed">
          {t('resetDevice')}
        </button>
      </div>

      <div className="bg-[#0C447C]/5 border border-[#0C447C]/15 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{t('gpsTitle')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('gpsDesc')}</p>
      </div>
    </div>
  )
}

/* ── Step 5: Review ── */
function ReviewStep({ t, data }: { t: ReturnType<typeof useTranslations>; data: WizardData }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('reviewTitle')}</h2>

      <ReviewSection title={t('reviewBasicSection')}>
        <ReviewRow label={t('reviewName')} value={data.name || t('notSet')} />
        <ReviewRow label={t('reviewEmployeeNumber')} value={data.employee_number || t('notSet')} />
        <ReviewRow label={t('reviewStatus')} value={t('statusActive')} />
      </ReviewSection>

      <ReviewSection title={t('reviewJobSection')}>
        <ReviewRow label={t('reviewDepartment')} value={data.department || t('notSet')} />
        <ReviewRow label={t('reviewJobTitle')} value={data.job_title || t('notSet')} />
        <ReviewRow label={t('reviewLocation')} value={data.city || t('mainBranch')} />
      </ReviewSection>

      <ReviewSection title={t('reviewAttendanceSection')}>
        <ReviewRow label={t('reviewAttendance')} value={data.enable_attendance ? t('attendanceEnabled') : t('attendanceNotEnabled')} />
        <ReviewRow label={t('reviewLink')} value={data.enable_attendance ? t('linkWillBeCreated') : t('linkNotCreated')} />
        <ReviewRow label={t('reviewDevice')} value={t('deviceNotBound')} />
      </ReviewSection>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
      {children}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
    </div>
  )
}

/* ── Right-hand summary panel ── */
function SummaryCard({ t, data, step }: { t: ReturnType<typeof useTranslations>; data: WizardData; step: Step }) {
  if (step === 5) {
    return (
      <div className="bg-[#fafcff] dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 h-fit">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">{t('readyTitle')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('readySubtitle')}</p>
        <ul className="space-y-2 mb-4">
          <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {t('readyEmployeeRecord')}
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {t('readyAttendanceProfile')}
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {t('readyAttendanceLink')}
          </li>
        </ul>
        <hr className="border-gray-100 dark:border-gray-800 mb-3" />
        <p className="text-xs text-gray-400">{t('readyNoLoginNote')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 h-fit">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">{t('summaryTitle')}</h3>
      <div className="h-[170px] rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
        {data.name ? (
          <div className="w-16 h-16 rounded-full bg-[#0C447C] flex items-center justify-center text-white text-xl font-semibold">
            {initials(data.name)}
          </div>
        ) : (
          t('summaryPhoto')
        )}
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{data.name || t('newEmployee')}</h3>
      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        <p>{t('summaryDepartment')}: {data.department || '-'}</p>
        <p>{t('summaryJobTitle')}: {data.job_title || '-'}</p>
        <p>{t('summaryAttendanceLink')}: {data.enable_attendance ? t('attendanceEnabled') : t('summaryLinkAfterActivation')}</p>
        <p>{t('summaryDevice')}: {t('deviceNotBound')}</p>
      </div>
    </div>
  )
}

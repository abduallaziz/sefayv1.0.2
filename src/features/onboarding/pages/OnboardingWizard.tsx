'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, ChevronRight, ChevronLeft, Building2, Tag, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ───────────────────────────────────────────────── */
interface FormData {
  businessName: string
  ownerName: string
  phone: string
  email: string
  activity: string
  branchName: string
  city: string
  currency: string
  vatEnabled: boolean
}

/* ── Activity data ───────────────────────────────────────── */
type ActivitySection = {
  key: string
  items: string[]
}

const ACTIVITY_SECTIONS: ActivitySection[] = [
  { key: 'restaurants', items: ['restaurant','cafe','fastFood','bakery','juice','foodTruck'] },
  { key: 'retail',      items: ['grocery','supermarket','perfume','stationery','gifts'] },
  { key: 'fashion',     items: ['menClothing','womenClothing','shoes','accessories','tailoring'] },
  { key: 'health',      items: ['pharmacy','medical','clinic','optics','supplements'] },
  { key: 'beauty',      items: ['barber','womenSalon','spa','cosmetics'] },
  { key: 'services',    items: ['carWash','laundry','phoneFix','carWorkshop','homeServices'] },
  { key: 'electronics', items: ['phones','gadgets','gaming'] },
  { key: 'home',        items: ['furniture','homeware','flowers','pets'] },
]

const CURRENCIES = ['SAR', 'AED', 'KWD', 'BHD', 'QAR', 'OMR']

/* ── Step indicator ──────────────────────────────────────── */
function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
              done   ? 'text-white'          : '',
              active ? 'text-white shadow-brand' : '',
              !done && !active ? 'bg-slate-100 text-slate-400' : '',
            )}
            style={done || active ? { background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' } : {}}
            >
              {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={cn(
                'h-0.5 w-8 sm:w-16 rounded-full transition-all duration-500',
                done ? 'bg-brand-primary' : 'bg-slate-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Input field ─────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 rounded-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand-primary transition-colors bg-white'

/* ── Step 1 — Business Info ──────────────────────────────── */
function Step1({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  const t = useTranslations('onboarding.info')
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }}>
          <Building2 className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t('title')}</h2>
      </div>
      <Field label={t('businessName')}>
        <input type="text" className={inputCls} placeholder={t('businessNamePlaceholder')}
          value={data.businessName} onChange={(e) => onChange('businessName', e.target.value)} />
      </Field>
      <Field label={t('ownerName')}>
        <input type="text" className={inputCls} placeholder={t('ownerNamePlaceholder')}
          value={data.ownerName} onChange={(e) => onChange('ownerName', e.target.value)} />
      </Field>
      <Field label={t('phone')}>
        <input type="tel" className={inputCls} placeholder={t('phonePlaceholder')}
          value={data.phone} onChange={(e) => onChange('phone', e.target.value)} />
      </Field>
      <Field label={t('email')}>
        <input type="email" className={inputCls} placeholder={t('emailPlaceholder')}
          value={data.email} onChange={(e) => onChange('email', e.target.value)} />
      </Field>
    </div>
  )
}

/* ── Step 2 — Activity ───────────────────────────────────── */
function Step2({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  const t = useTranslations('onboarding.activity')
  const [open, setOpen] = useState<string | null>(ACTIVITY_SECTIONS[0].key)

  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }}>
          <Tag className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t('title')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pe-1">
        {ACTIVITY_SECTIONS.map((section) => (
          <div key={section.key} className="border border-slate-200 rounded-sm overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setOpen(open === section.key ? null : section.key)}
            >
              <span>{t(section.key)}</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={cn('transition-transform duration-200 text-slate-400', open === section.key ? 'rotate-90' : '')}
              />
            </button>

            {/* Items */}
            {open === section.key && (
              <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {section.items.map((item) => {
                  const selected = data.activity === item
                  return (
                    <button
                      key={item}
                      onClick={() => onChange('activity', item)}
                      className={cn(
                        'px-3 py-2 rounded-sm text-xs font-medium text-start transition-all duration-150',
                        selected
                          ? 'text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-brand-light hover:text-brand-primary border border-slate-200'
                      )}
                      style={selected ? { background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' } : {}}
                    >
                      {t(item)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Step 3 — Settings ───────────────────────────────────── */
function Step3({ data, onChange, onToggleVat }: {
  data: FormData
  onChange: (k: keyof FormData, v: string) => void
  onToggleVat: () => void
}) {
  const t = useTranslations('onboarding.settings')
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }}>
          <Settings className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t('title')}</h2>
      </div>

      <Field label={t('branchName')}>
        <input type="text" className={inputCls} placeholder={t('branchNamePlaceholder')}
          value={data.branchName} onChange={(e) => onChange('branchName', e.target.value)} />
      </Field>

      <Field label={t('city')}>
        <input type="text" className={inputCls} placeholder={t('cityPlaceholder')}
          value={data.city} onChange={(e) => onChange('city', e.target.value)} />
      </Field>

      <Field label={t('currency')}>
        <select
          className={inputCls}
          value={data.currency}
          onChange={(e) => onChange('currency', e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      {/* VAT toggle */}
      <div
        className="flex items-center justify-between p-4 rounded-sm border border-slate-200 cursor-pointer hover:border-brand-primary/40 transition-colors"
        onClick={onToggleVat}
      >
        <span className="text-sm font-medium text-slate-700">{t('vatEnabled')}</span>
        <div className={cn(
          'w-11 h-6 rounded-full relative transition-colors duration-200',
          data.vatEnabled ? 'bg-brand-primary' : 'bg-slate-200'
        )}>
          <div className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
            data.vatEnabled ? 'start-6' : 'start-1'
          )} />
        </div>
      </div>
    </div>
  )
}

/* ── Step 4 — Summary ────────────────────────────────────── */
function Step4({ data, onEdit, t: tOnboarding }: {
  data: FormData
  onEdit: (step: number) => void
  t: ReturnType<typeof useTranslations>
}) {
  const ts = useTranslations('onboarding.summary')
  const ta = useTranslations('onboarding.activity')

  const rows = [
    { label: ts('businessName'), value: data.businessName || '—', step: 0 },
    { label: ts('activity'),     value: data.activity ? ta(data.activity as Parameters<typeof ta>[0]) : '—', step: 1 },
    { label: ts('city'),         value: data.city || '—', step: 2 },
    { label: ts('currency'),     value: data.currency, step: 2 },
    { label: ts('vat'),          value: data.vatEnabled ? ts('vatOn') : ts('vatOff'), step: 2 },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }}>
          <Sparkles className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{ts('title')}</h2>
        <p className="text-sm text-slate-500 mt-1">{ts('subtitle')}</p>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-sm border border-slate-100">
            <span className="text-sm text-slate-500">{row.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800">{row.value}</span>
              <button
                onClick={() => onEdit(row.step)}
                className="text-xs text-brand-primary hover:underline font-medium"
              >
                {ts('editStep')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Wizard ─────────────────────────────────────────── */
export function OnboardingWizard() {
  const t = useTranslations('onboarding')
  const locale = useLocale()
  const router = useRouter()
  const isRtl = locale === 'ar'

  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    activity: '',
    branchName: '',
    city: '',
    currency: 'SAR',
    vatEnabled: true,
  })

  const TOTAL = 4
  const STEP_LABELS = [t('step1'), t('step2'), t('step3'), t('step4')]

  function onChange(key: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function onToggleVat() {
    setData((prev) => ({ ...prev, vatEnabled: !prev.vatEnabled }))
  }

  function next() {
    if (step < TOTAL - 1) setStep(step + 1)
    else router.push(`/${locale}/dashboard`)
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  const BackIcon  = isRtl ? ChevronRight : ChevronLeft
  const NextIcon  = isRtl ? ChevronLeft  : ChevronRight

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #082F5C 0%, #0C447C 40%, #1565C0 80%, #2671C4 100%)' }}
    >
      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-md shadow-xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((step + 1) / TOTAL) * 100}%`,
              background: 'linear-gradient(90deg, #082F5C 0%, #1761B8 100%)',
            }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Step counter */}
          <p className="text-center text-xs text-slate-400 mb-4">
            {t('stepOf', { current: step + 1, total: TOTAL })}
          </p>

          {/* Step dots */}
          <StepIndicator current={step} total={TOTAL} labels={STEP_LABELS} />

          {/* Step content */}
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
            {step === 0 && <Step1 data={data} onChange={onChange} />}
            {step === 1 && <Step2 data={data} onChange={onChange} />}
            {step === 2 && <Step3 data={data} onChange={onChange} onToggleVat={onToggleVat} />}
            {step === 3 && <Step4 data={data} onEdit={setStep} t={t} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <BackIcon size={16} strokeWidth={2} />
              {t('back')}
            </button>

            <button
              onClick={next}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }}
            >
              {step === TOTAL - 1 ? t('finish') : t('next')}
              {step < TOTAL - 1 && <NextIcon size={16} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
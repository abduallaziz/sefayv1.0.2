'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { Check, ChevronRight, ChevronLeft, Building2, Tag, Settings, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRegister } from '@/features/auth/hooks/use-auth'
import { ApiError } from '@/lib/api'

/* ── Types ───────────────────────────────────────────────── */
interface FormData {
  businessName: string
  ownerName: string
  countryCode: string
  phone: string
  email: string
  password: string
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

/* ── Country dial codes ──────────────────────────────────── */
const COUNTRY_CODES: { code: string; dial: string; flag: string }[] = [
  { code: 'SA', dial: '+966', flag: '🇸🇦' },
  { code: 'AE', dial: '+971', flag: '🇦🇪' },
  { code: 'KW', dial: '+965', flag: '🇰🇼' },
  { code: 'BH', dial: '+973', flag: '🇧🇭' },
  { code: 'QA', dial: '+974', flag: '🇶🇦' },
  { code: 'OM', dial: '+968', flag: '🇴🇲' },
  { code: 'EG', dial: '+20', flag: '🇪🇬' },
  { code: 'JO', dial: '+962', flag: '🇯🇴' },
  { code: 'LB', dial: '+961', flag: '🇱🇧' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶' },
  { code: 'YE', dial: '+967', flag: '🇾🇪' },
  { code: 'SY', dial: '+963', flag: '🇸🇾' },
  { code: 'PS', dial: '+970', flag: '🇵🇸' },
  { code: 'SD', dial: '+249', flag: '🇸🇩' },
  { code: 'LY', dial: '+218', flag: '🇱🇾' },
  { code: 'TN', dial: '+216', flag: '🇹🇳' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿' },
  { code: 'MA', dial: '+212', flag: '🇲🇦' },
  { code: 'TR', dial: '+90', flag: '🇹🇷' },
  { code: 'US', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', dial: '+44', flag: '🇬🇧' },
  { code: 'IN', dial: '+91', flag: '🇮🇳' },
  { code: 'PK', dial: '+92', flag: '🇵🇰' },
  { code: 'PH', dial: '+63', flag: '🇵🇭' },
  { code: 'BD', dial: '+880', flag: '🇧🇩' },
]

const PHONE_REGEX = /^[1-9]\d{6,13}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

function isValidPhone(v: string) {
  return PHONE_REGEX.test(v.trim().replace(/[\s-]/g, ''))
}

function isValidEmail(v: string) {
  return EMAIL_REGEX.test(v.trim())
}

/* ── Step indicator ──────────────────────────────────────── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                'w-9 h-9 rounded-[11px] flex items-center justify-center text-xs font-bold transition-all duration-300',
                done || active ? 'text-white' : 'text-[#8C9CB2]'
              )}
              style={
                done || active
                  ? { background: 'linear-gradient(135deg,#0C447C,#1565C0)', boxShadow: '0 4px 14px rgba(12,68,124,.3)' }
                  : { background: '#F5F8FC', border: '1px solid #E4EAF2' }
              }
            >
              {done ? <Check size={15} strokeWidth={2.5} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className="h-[3px] w-8 sm:w-16 rounded-full transition-all duration-500"
                style={{ background: done ? 'linear-gradient(90deg,#0C447C,#1565C0)' : '#E4EAF2' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Input field ─────────────────────────────────────────── */
function Field({ label, errorText, children }: { label: string; errorText?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-[7px]">
      <label className="block text-[13px] font-semibold text-[#54657C]">
        {label} <span className="text-[#A32D2D]">*</span>
      </label>
      {children}
      {errorText && <p className="text-[12px] text-[#A32D2D] font-medium">{errorText}</p>}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-3 rounded-[11px] border border-[#E4EAF2] text-sm font-[inherit] text-[#0A1628] bg-[#F5F8FC] outline-none transition-all focus:border-[#0C447C] focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(12,68,124,.11)]"

function fieldCls(invalid: boolean) {
  return cn(inputCls, invalid && 'border-[#A32D2D] bg-[#FCEBEB] focus:border-[#A32D2D]')
}

function StepIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div
      className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4"
      style={{ background: 'linear-gradient(135deg,#0C447C,#1565C0)', boxShadow: '0 8px 20px rgba(12,68,124,.28)' }}
    >
      {icon}
    </div>
  )
}

/* ── Step 1 — Business Info ──────────────────────────────── */
function Step1({ data, onChange, showErrors }: { data: FormData; onChange: (k: keyof FormData, v: string) => void; showErrors: boolean }) {
  const t = useTranslations('onboarding.info')
  const tc = useTranslations('onboarding')
  const [showPassword, setShowPassword] = useState(false)

  const err = (v: string) => showErrors && !v.trim() ? tc('fieldRequired') : undefined
  const phoneErr = showErrors
    ? !data.phone.trim()
      ? tc('fieldRequired')
      : !isValidPhone(data.phone)
        ? tc('phoneInvalid')
        : undefined
    : undefined
  const emailErr = showErrors
    ? !data.email.trim()
      ? tc('fieldRequired')
      : !isValidEmail(data.email)
        ? tc('emailInvalid')
        : undefined
    : undefined

  return (
    <div className="space-y-4">
      <div className="text-center mb-7">
        <StepIcon icon={<Building2 className="w-7 h-7 text-white" strokeWidth={2} />} />
        <h2 className="text-[21px] font-bold text-[#0A1628]">{t('title')}</h2>
      </div>
      <Field label={t('businessName')} errorText={err(data.businessName)}>
        <input type="text" className={fieldCls(!!err(data.businessName))} placeholder={t('businessNamePlaceholder')}
          value={data.businessName} onChange={(e) => onChange('businessName', e.target.value)} />
      </Field>
      <Field label={t('ownerName')} errorText={err(data.ownerName)}>
        <input type="text" className={fieldCls(!!err(data.ownerName))} placeholder={t('ownerNamePlaceholder')}
          value={data.ownerName} onChange={(e) => onChange('ownerName', e.target.value)} />
      </Field>
      <Field label={t('phone')} errorText={phoneErr}>
        <div
          dir="ltr"
          className={cn(
            'flex items-stretch rounded-[11px] border bg-[#F5F8FC] transition-all overflow-hidden',
            'focus-within:bg-white focus-within:border-[#0C447C] focus-within:shadow-[0_0_0_3.5px_rgba(12,68,124,.11)]',
            phoneErr ? 'border-[#A32D2D] bg-[#FCEBEB] focus-within:border-[#A32D2D]' : 'border-[#E4EAF2]'
          )}
        >
          <div className="relative flex items-center" style={{ flexShrink: 0 }}>
            <select
              className="h-full appearance-none ps-3 pe-7 text-sm font-semibold text-[#0A1628] bg-transparent outline-none cursor-pointer border-e border-[#E4EAF2]"
              value={data.countryCode}
              onChange={(e) => onChange('countryCode', e.target.value)}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
              ))}
            </select>
            <ChevronRight size={13} strokeWidth={2.5} className="absolute pointer-events-none text-[#8C9CB2] rotate-90" style={{ insetInlineEnd: 9 }} />
          </div>
          <input
            type="tel"
            className="flex-1 min-w-0 px-3 py-3 text-sm font-[inherit] text-[#0A1628] bg-transparent outline-none text-start"
            placeholder={t('phonePlaceholder')}
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value.replace(/^0+/, ''))}
          />
        </div>
      </Field>
      <Field label={t('email')} errorText={emailErr}>
        <input type="email" className={fieldCls(!!emailErr)} placeholder={t('emailPlaceholder')}
          value={data.email} onChange={(e) => onChange('email', e.target.value)} />
      </Field>
      <Field label={t('password')} errorText={err(data.password)}>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className={fieldCls(!!err(data.password))}
            style={{ paddingInlineEnd: 42 }}
            placeholder={t('passwordPlaceholder')}
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', insetInlineEnd: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C9CB2', display: 'flex', alignItems: 'center' }}
          >
            {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
          </button>
        </div>
      </Field>
    </div>
  )
}

/* ── Step 2 — Activity ───────────────────────────────────── */
function Step2({ data, onChange, showErrors }: { data: FormData; onChange: (k: keyof FormData, v: string) => void; showErrors: boolean }) {
  const t = useTranslations('onboarding.activity')
  const tc = useTranslations('onboarding')
  const [open, setOpen] = useState<string | null>(ACTIVITY_SECTIONS[0].key)
  const invalid = showErrors && !data.activity

  return (
    <div className="space-y-3">
      <div className="text-center mb-7">
        <StepIcon icon={<Tag className="w-7 h-7 text-white" strokeWidth={2} />} />
        <h2 className="text-[21px] font-bold text-[#0A1628]">{t('title')}</h2>
        <p className="text-[14px] text-[#8C9CB2] mt-1">{t('subtitle')}</p>
      </div>

      {invalid && (
        <p className="text-[13px] text-[#A32D2D] font-medium text-center">{tc('activityRequired')}</p>
      )}

      <div className={cn('space-y-2 max-h-[400px] overflow-y-auto pe-1 rounded-[15px]', invalid && 'ring-2 ring-[#A32D2D]/40 p-2')}>
        {ACTIVITY_SECTIONS.map((section) => (
          <div key={section.key} className="border border-[#E4EAF2] rounded-[13px] overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-[#54657C] hover:bg-[#F5F8FC] transition-colors"
              onClick={() => setOpen(open === section.key ? null : section.key)}
            >
              <span>{t(section.key)}</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={cn('transition-transform duration-200 text-[#B4C0CF]', open === section.key ? 'rotate-90' : '')}
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
                        'px-3 py-2 rounded-[10px] text-[13px] font-medium text-start transition-all duration-150',
                        selected
                          ? 'text-white'
                          : 'bg-[#F5F8FC] text-[#54657C] hover:bg-[#EAF2FB] hover:text-[#0C447C] border border-[#E4EAF2]'
                      )}
                      style={selected ? { background: 'linear-gradient(135deg,#0C447C,#1565C0)', boxShadow: '0 4px 12px rgba(12,68,124,.25)' } : {}}
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
function Step3({ data, onChange, onToggleVat, showErrors }: {
  data: FormData
  onChange: (k: keyof FormData, v: string) => void
  onToggleVat: () => void
  showErrors: boolean
}) {
  const t = useTranslations('onboarding.settings')
  const tc = useTranslations('onboarding')
  const err = (v: string) => showErrors && !v.trim() ? tc('fieldRequired') : undefined

  return (
    <div className="space-y-4">
      <div className="text-center mb-7">
        <StepIcon icon={<Settings className="w-7 h-7 text-white" strokeWidth={2} />} />
        <h2 className="text-[21px] font-bold text-[#0A1628]">{t('title')}</h2>
      </div>

      <Field label={t('branchName')} errorText={err(data.branchName)}>
        <input type="text" className={fieldCls(!!err(data.branchName))} placeholder={t('branchNamePlaceholder')}
          value={data.branchName} onChange={(e) => onChange('branchName', e.target.value)} />
      </Field>

      <Field label={t('city')} errorText={err(data.city)}>
        <input type="text" className={fieldCls(!!err(data.city))} placeholder={t('cityPlaceholder')}
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
        className="flex items-center justify-between p-4 rounded-[13px] border border-[#E4EAF2] cursor-pointer hover:border-[#0C447C]/40 transition-colors bg-[#F5F8FC]"
        onClick={onToggleVat}
      >
        <span className="text-[14px] font-medium text-[#54657C]">{t('vatEnabled')}</span>
        <div className={cn(
          'w-11 h-6 rounded-full relative transition-colors duration-200',
          data.vatEnabled ? '' : 'bg-[#E4EAF2]'
        )}
          style={data.vatEnabled ? { background: 'linear-gradient(135deg,#0C447C,#1565C0)' } : {}}
        >
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
function Step4({ data, onEdit }: {
  data: FormData
  onEdit: (step: number) => void
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
      <div className="text-center mb-7">
        <StepIcon icon={<Sparkles className="w-7 h-7 text-white" strokeWidth={2} />} />
        <h2 className="text-[21px] font-bold text-[#0A1628]">{ts('title')}</h2>
        <p className="text-[14px] text-[#8C9CB2] mt-1">{ts('subtitle')}</p>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 bg-[#F5F8FC] rounded-[12px] border border-[#E4EAF2]">
            <span className="text-[14px] text-[#8C9CB2]">{row.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold text-[#0A1628]">{row.value}</span>
              <button
                onClick={() => onEdit(row.step)}
                className="text-[12px] text-[#0C447C] hover:underline font-semibold"
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
  const isRtl = locale === 'ar'
  const register = useRegister()

  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    countryCode: '+966',
    phone: '',
    email: '',
    password: '',
    activity: '',
    branchName: '',
    city: '',
    currency: 'SAR',
    vatEnabled: true,
  })

  const TOTAL = 4
  const [showErrors, setShowErrors] = useState(false)

  function onChange(key: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function onToggleVat() {
    setData((prev) => ({ ...prev, vatEnabled: !prev.vatEnabled }))
  }

  function isStepValid(s: number): boolean {
    switch (s) {
      case 0:
        return !!(
          data.businessName.trim() &&
          data.ownerName.trim() &&
          data.password.trim() &&
          isValidPhone(data.phone) &&
          isValidEmail(data.email)
        )
      case 1:
        return !!data.activity
      case 2:
        return !!(data.branchName.trim() && data.city.trim())
      default:
        return true
    }
  }

  function next() {
    if (!isStepValid(step)) {
      setShowErrors(true)
      return
    }

    if (step < TOTAL - 1) {
      setShowErrors(false)
      setStep(step + 1)
      return
    }

    register.mutate({
      businessName: data.businessName,
      ownerName: data.ownerName,
      phone: `${data.countryCode}${data.phone.trim().replace(/[\s-]/g, '')}`,
      email: data.email,
      password: data.password,
      activity: data.activity,
      branchName: data.branchName,
      city: data.city,
      currency: data.currency,
      vatEnabled: data.vatEnabled,
      language: locale,
      device_name: 'Onboarding Web',
    })
  }

  function back() {
    setShowErrors(false)
    if (step > 0) setStep(step - 1)
  }

  function editStep(s: number) {
    setShowErrors(false)
    setStep(s)
  }

  const errorMessage = register.error
    ? register.error instanceof ApiError && register.error.status === 409
      ? t('errorEmailTaken')
      : t('errorGeneric')
    : null

  const BackIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <div className="min-h-screen bg-white" style={{ color: '#0A1628', fontSize: 15, lineHeight: 1.6 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>

      {/* ── Brand header ── */}
      <header
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(115deg,#082F5C 0%,#0C447C 42%,#1761B8 100%)', boxShadow: '0 6px 28px rgba(8,47,92,.42)' }}
      >
        <div className="max-w-[640px] mx-auto px-6 py-5 flex items-center justify-center gap-[10px]">
          <div
            className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,.28),rgba(255,255,255,.12))', border: '1px solid rgba(255,255,255,.3)' }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: '#fff', stroke: 'none' }}><path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" /></svg>
          </div>
          <span className="text-[20px] font-bold text-white" style={{ letterSpacing: '-.5px' }}>Sefay</span>
        </div>
      </header>

      {/* ── Page background + wizard ── */}
      <div className="relative" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'linear-gradient(#EEF2F7 1px,transparent 1px),linear-gradient(90deg,#EEF2F7 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,#000,transparent 75%)',
            opacity: .5,
          }}
        />
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'radial-gradient(900px 500px at 80% -10%,rgba(37,99,235,.08),transparent 55%),radial-gradient(700px 500px at 10% 20%,rgba(12,68,124,.05),transparent 50%)' }}
        />

        <div className="relative z-10 flex items-center justify-center px-4">
          <div
            className="w-full max-w-lg bg-white rounded-[24px] overflow-hidden"
            style={{ border: '1px solid #E4EAF2', boxShadow: '0 8px 16px rgba(10,22,40,.05),0 20px 48px rgba(10,22,40,.12)' }}
          >
            {/* Progress bar */}
            <div className="h-[5px] bg-[#F5F8FC]">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${((step + 1) / TOTAL) * 100}%`, background: 'linear-gradient(90deg,#0C447C,#1565C0)' }}
              />
            </div>

            <div className="p-6 sm:p-9">
              {/* Step counter */}
              <p className="text-center text-[12.5px] font-semibold text-[#B4C0CF] mb-5" style={{ letterSpacing: '.04em' }}>
                {t('stepOf', { current: step + 1, total: TOTAL })}
              </p>

              {/* Step dots */}
              <StepIndicator current={step} total={TOTAL} />

              {/* Step content */}
              <div key={step} style={{ animation: 'fadeUp .35s cubic-bezier(.4,0,.2,1) backwards' }}>
                {step === 0 && <Step1 data={data} onChange={onChange} showErrors={showErrors} />}
                {step === 1 && <Step2 data={data} onChange={onChange} showErrors={showErrors} />}
                {step === 2 && <Step3 data={data} onChange={onChange} onToggleVat={onToggleVat} showErrors={showErrors} />}
                {step === 3 && <Step4 data={data} onEdit={editStep} />}
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="flex items-center gap-2 bg-[#FCEBEB] border border-[#A32D2D]/20 rounded-[11px] px-4 py-3 text-[#A32D2D] text-[13px] mt-6">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #EEF2F7' }}>
                <button
                  onClick={back}
                  disabled={step === 0 || register.isPending}
                  className="flex items-center gap-[6px] px-4 py-[10px] rounded-[11px] text-[14px] font-semibold text-[#8C9CB2] hover:text-[#54657C] hover:bg-[#F5F8FC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <BackIcon size={16} strokeWidth={2} />
                  {t('back')}
                </button>

                <button
                  onClick={next}
                  disabled={register.isPending}
                  className="inline-flex items-center gap-2 transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    padding: '12px 26px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    background: 'linear-gradient(135deg,#0C447C,#1565C0)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(12,68,124,.3),0 2px 6px rgba(12,68,124,.22)',
                  }}
                >
                  {step === TOTAL - 1
                    ? register.isPending ? t('creating') : t('finish')
                    : t('next')}
                  {step < TOTAL - 1 && <NextIcon size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

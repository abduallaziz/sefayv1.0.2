'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ApiError } from '@/lib/api'
import { useBranches } from '@/shared/hooks/useBranches'
import { normalizeDigits } from '@/features/settings/lib/validators'
import { zatcaApi, type CreateZatcaDevice, type ZatcaDevice, type ZatcaEnv } from '../api/zatca.api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 space-y-4 dark:border-gray-800 dark:bg-gray-900'
const label = 'text-xs font-medium text-slate-600 dark:text-gray-400'
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Failed')
// (msg stays for the per-device actions; the add-device form shows its errors inline)

const EMPTY = {
  branch_id: '',
  env: 'sandbox' as ZatcaEnv,
  egs_name: '',
  business_category: '',
  legal_name: '',
  vat_number: '',
  crn: '',
  street: '',
  building_no: '',
  district: '',
  city: '',
  postal_zone: '',
}

function Field({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={label}>{l}</label>
      {children}
    </div>
  )
}

function DeviceCard({ d, branchName }: { d: ZatcaDevice; branchName: string }) {
  const t = useTranslations('zatca')
  const qc = useQueryClient()
  const [otp, setOtp] = useState('')
  const [csr, setCsr] = useState<string | null>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: ['zatca'] })
  const fail = (e: unknown) => toast.error(msg(e))

  const csrM = useMutation({ mutationFn: () => zatcaApi.csr(d.id), onSuccess: (r) => { setCsr(r.csr_pem); refresh() }, onError: fail })
  const onboardM = useMutation({ mutationFn: () => zatcaApi.onboard(d.id, otp), onSuccess: () => { toast.success(t('stepDone')); setOtp(''); refresh() }, onError: fail })
  const checksM = useMutation({
    mutationFn: () => zatcaApi.checks(d.id),
    onSuccess: (r) => { r.passed ? toast.success(t('checksPassed')) : toast.error(t('checksFailed')); refresh() },
    onError: fail,
  })
  const activateM = useMutation({ mutationFn: () => zatcaApi.activate(d.id), onSuccess: () => { toast.success(t('activated')); refresh() }, onError: fail })
  const deleteM = useMutation({ mutationFn: () => zatcaApi.deleteDevice(d.id), onSuccess: () => { toast.success(t('deviceDeleted')); refresh() }, onError: fail })

  const stage = d.status === 'active' ? 'active' : d.csid_kind === 'compliance' ? 'compliance' : d.has_csr ? 'csr' : 'new'
  const isSandbox = d.env === 'sandbox'

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">{branchName}</h3>
          <p className="text-xs text-slate-500">
            {d.seller.legal_name} · {d.seller.vat_number} · {t(`env.${d.env}`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-gray-800">{t(`stage.${stage}`)}</span>
          <button
            type="button"
            onClick={() => { if (confirm(t('deleteConfirm'))) deleteM.mutate() }}
            disabled={deleteM.isPending}
            className="text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            {t('delete')}
          </button>
        </div>
      </div>

      {stage === 'new' && (
        <Button onClick={() => csrM.mutate()} disabled={csrM.isPending}>{t('makeCsr')}</Button>
      )}

      {(stage === 'csr' || csr) && stage !== 'compliance' && stage !== 'active' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">{t('otpHint')}</p>
          <div className="flex gap-2">
            <Input value={otp} inputMode="numeric" maxLength={6} placeholder="123456" onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="max-w-[160px]" />
            <Button onClick={() => onboardM.mutate()} disabled={otp.length !== 6 || onboardM.isPending}>{t('requestCsid')}</Button>
          </div>
        </div>
      )}

      {stage === 'compliance' && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => checksM.mutate()} disabled={checksM.isPending}>{t('runChecks')}</Button>
          {/* Sandbox devices go live on the compliance CSID right after the checks — no production step. */}
          {!isSandbox && <Button onClick={() => activateM.mutate()} disabled={activateM.isPending}>{t('activate')}</Button>}
        </div>
      )}
    </div>
  )
}

export function ZatcaPage() {
  const t = useTranslations('zatca')
  const qc = useQueryClient()
  const devices = useQuery({ queryKey: ['zatca', 'devices'], queryFn: zatcaApi.devices })
  const invoices = useQuery({ queryKey: ['zatca', 'invoices'], queryFn: zatcaApi.invoices })
  const branches = useBranches()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState<string[]>([])
  const NUMERIC: (keyof typeof EMPTY)[] = ['vat_number', 'building_no', 'postal_zone']
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = e.target.value
    setErrors([])
    setF({ ...f, [k]: NUMERIC.includes(k) ? normalizeDigits(raw).replace(/\D/g, '') : raw })
  }

  const validate = (): string[] => {
    const out: string[] = []
    const need: [keyof typeof EMPTY, string][] = [
      ['branch_id', 'branch'], ['legal_name', 'legalName'], ['vat_number', 'vat'], ['crn', 'crn'], ['egs_name', 'egsName'],
      ['business_category', 'category'], ['street', 'street'], ['building_no', 'building'], ['district', 'district'],
      ['city', 'city'], ['postal_zone', 'postal'],
    ]
    for (const [k, key] of need) if (!f[k].trim()) out.push(t('errRequired', { field: t(`f.${key}`) }))
    if (f.vat_number && !/^3\d{13}3$/.test(f.vat_number)) out.push(t('errVat'))
    if (f.building_no && !/^\d{4}$/.test(f.building_no)) out.push(t('errBuilding'))
    if (f.postal_zone && !/^\d{5}$/.test(f.postal_zone)) out.push(t('errPostal'))
    return out
  }
  const submit = () => {
    const errs = validate()
    setErrors(errs)
    if (errs.length === 0) create.mutate()
  }

  const create = useMutation({
    mutationFn: () => {
      const dto: CreateZatcaDevice = {
        branch_id: f.branch_id,
        env: f.env,
        egs_name: f.egs_name,
        business_category: f.business_category,
        seller: {
          legal_name: f.legal_name, vat_number: f.vat_number, crn: f.crn, street: f.street,
          building_no: f.building_no, district: f.district, city: f.city, postal_zone: f.postal_zone,
        },
      }
      return zatcaApi.createDevice(dto)
    },
    onSuccess: () => { toast.success(t('deviceCreated')); setOpen(false); setF(EMPTY); qc.invalidateQueries({ queryKey: ['zatca'] }) },
    onError: (e) => setErrors(e instanceof ApiError ? e.message.split(/[،,]\s*/).filter(Boolean) : [t('errGeneric')]),
  })
  const flush = useMutation({
    mutationFn: zatcaApi.flush,
    onSuccess: (r) => { toast.success(t('flushed', { sent: r.sent, waiting: r.waiting })); qc.invalidateQueries({ queryKey: ['zatca'] }) },
    onError: (e) => toast.error(msg(e)),
  })

  const branchName = (id: string) => branches.data?.find((b) => b.id === id)?.name ?? id
  const pending = invoices.data?.filter((i) => i.status === 'pending' || i.status === 'error').length ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      {(devices.data ?? []).map((d) => (
        <DeviceCard key={d.id} d={d} branchName={branchName(d.branch_id)} />
      ))}

      {open ? (
        <div className={card}>
          <h3 className="text-sm font-bold">{t('newDevice')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field l={t('f.branch')}>
              <select className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-gray-700" value={f.branch_id} onChange={set('branch_id')}>
                <option value="">—</option>
                {branches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field l={t('f.env')}>
              <select className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-gray-700" value={f.env} onChange={set('env')}>
                {(['sandbox', 'simulation', 'production'] as const).map((e) => <option key={e} value={e}>{t(`env.${e}`)}</option>)}
              </select>
            </Field>
            <Field l={t('f.legalName')}><Input value={f.legal_name} onChange={set('legal_name')} /></Field>
            <Field l={t('f.vat')}><Input value={f.vat_number} maxLength={15} inputMode="numeric" onChange={set('vat_number')} /></Field>
            <Field l={t('f.crn')}><Input value={f.crn} onChange={set('crn')} /></Field>
            <Field l={t('f.egsName')}><Input value={f.egs_name} onChange={set('egs_name')} /></Field>
            <Field l={t('f.category')}><Input value={f.business_category} onChange={set('business_category')} /></Field>
            <Field l={t('f.street')}><Input value={f.street} onChange={set('street')} /></Field>
            <Field l={t('f.building')}><Input value={f.building_no} maxLength={4} inputMode="numeric" onChange={set('building_no')} /></Field>
            <Field l={t('f.district')}><Input value={f.district} onChange={set('district')} /></Field>
            <Field l={t('f.city')}><Input value={f.city} onChange={set('city')} /></Field>
            <Field l={t('f.postal')}><Input value={f.postal_zone} maxLength={5} inputMode="numeric" onChange={set('postal_zone')} /></Field>
          </div>
          {errors.length > 0 && (
            <ul role="alert" className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {errors.map((er, i) => <li key={i}>{er}</li>)}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); setErrors([]) }}>{t('cancel')}</Button>
            <Button onClick={submit} disabled={create.isPending}>{t('save')}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)}>{t('addDevice')}</Button>
      )}

      <div className={card}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{t('queue')}</h3>
          <Button variant="outline" onClick={() => flush.mutate()} disabled={flush.isPending}>{t('send')}</Button>
        </div>
        <p className="text-xs text-slate-500">{t('queueHint', { count: pending })}</p>
        <ul className="divide-y divide-slate-100 text-sm dark:divide-gray-800">
          {(invoices.data ?? []).slice(0, 15).map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2">
              <span>{i.invoice_no} <span className="text-xs text-slate-500">#{i.icv} · {t(`kind.${i.kind}`)}</span></span>
              <span className="text-xs">{t(`status.${i.status}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

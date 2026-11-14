'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, AlertTriangle, Building2, Warehouse, BookOpenCheck } from 'lucide-react'
import { SimpleSelect } from '@/features/tables/components/SimpleSelect'
import type { BranchRecord, WizardCopyTypeResult } from '../api/branches.api'
import { BranchDraft, COPY_GROUPS, CopyGroupKey, WEEKDAYS } from '../lib/branch-draft'

export interface CopyState {
  mode: 'empty' | 'copy'
  sourceId: string
  groups: CopyGroupKey[]
}

const CARD = 'rounded-xl border border-posCloud-border dark:border-posCloudDark-border'
const MUTED = 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
const STRONG = 'text-posCloud-text-primary dark:text-posCloudDark-text-primary'

function Option({
  checked,
  disabled,
  title,
  hint,
  onSelect,
}: {
  checked: boolean
  disabled?: boolean
  title: string
  hint: string
  onSelect: () => void
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${CARD} ${
        checked ? 'border-posCloud-primary bg-posCloud-primary-light dark:bg-posCloud-primary/10' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input type="radio" name="bw-data-mode" className="mt-1" checked={checked} disabled={disabled} onChange={onSelect} />
      <span>
        <span className={`block text-sm font-medium ${STRONG}`}>{title}</span>
        <span className={`block text-xs ${MUTED}`}>{hint}</span>
      </span>
    </label>
  )
}

export function DataStep({
  canCopy,
  branches,
  state,
  onMode,
  onSource,
  onToggle,
  error,
}: {
  canCopy: boolean
  branches: BranchRecord[]
  state: CopyState
  onMode: (m: CopyState['mode']) => void
  onSource: (id: string) => void
  onToggle: (k: CopyGroupKey) => void
  error?: string
}) {
  const w = useTranslations('branches.wizard')
  return (
    <div className="space-y-3" role="radiogroup" aria-label={w('steps.data')}>
      <Option checked={state.mode === 'empty'} title={w('dataEmpty')} hint={w('dataEmptyHint')} onSelect={() => onMode('empty')} />
      {canCopy ? (
        <Option checked={state.mode === 'copy'} title={w('dataCopy')} hint={w('dataCopyHint')} onSelect={() => onMode('copy')} />
      ) : (
        <p className={`text-xs ${MUTED}`}>{w('dataCopyUnavailable')}</p>
      )}
      {canCopy && state.mode === 'copy' && (
        <div className={`${CARD} p-3 space-y-3`}>
          <div>
            <span className={`block text-xs font-medium mb-1.5 ${MUTED}`}>{w('sourceBranch')}</span>
            <SimpleSelect
              value={state.sourceId}
              onChange={onSource}
              ariaLabel={w('sourceBranch')}
              options={branches.map((b) => ({ value: b.id, label: b.is_main ? `${b.name} (${w('main')})` : b.name }))}
            />
          </div>
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className={`text-xs font-medium mb-1.5 ${MUTED}`}>{w('copyWhat')}</legend>
            {COPY_GROUPS.map((g) => (
              <label key={g.key} className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={state.groups.includes(g.key)}
                  onChange={() => onToggle(g.key)}
                />
                <span>
                  <span className={STRONG}>{w(`groups.${g.key}`)}</span>
                  <span className={`block text-xs ${MUTED}`}>{w(`groupHints.${g.key}`)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {error && (
            <p role="alert" className="text-xs text-posCloud-danger">
              {error}
            </p>
          )}
          <p className={`text-xs ${MUTED}`}>{w('copyStockNote')}</p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className={`shrink-0 ${MUTED}`}>{label}</dt>
      <dd className={`text-end min-w-0 break-words ${STRONG}`}>{value || '-'}</dd>
    </div>
  )
}

export function ReviewStep({
  draft,
  warehouseName,
  copy,
  sourceName,
}: {
  draft: BranchDraft
  warehouseName: string
  copy: CopyState
  sourceName: string
}) {
  const t = useTranslations('branches')
  const w = useTranslations('branches.wizard')
  const d = useTranslations('branches.wizard.days')
  const hours = draft.hoursEnabled
    ? WEEKDAYS.map((day) => {
        const h = draft.hours[day]
        return `${d(day)}: ${h.closed ? w('closed') : `${h.open} - ${h.close}`}`
      }).join(' | ')
    : w('notSet')
  return (
    <div className="space-y-3">
      <dl className={`${CARD} px-4 divide-y divide-posCloud-border dark:divide-posCloudDark-border`}>
        <Row label={t('name')} value={draft.name} />
        <Row label={w('shortCode')} value={draft.shortCode} />
        <Row label={w('city')} value={draft.city} />
        <Row label={w('phone')} value={<span dir="ltr">{draft.phone}</span>} />
        <Row label={w('email')} value={<span dir="ltr">{draft.email}</span>} />
        <Row label={t('address')} value={draft.address} />
        <Row
          label={w('mapTitle')}
          value={draft.lat != null && draft.lng != null ? `${draft.lat}, ${draft.lng} (${draft.radius} m)` : w('notSet')}
        />
        <Row label={w('warehouseName')} value={warehouseName} />
        <Row label={w('vat')} value={<span dir="ltr">{draft.vat}</span>} />
        <Row label={w('cr')} value={<span dir="ltr">{draft.cr}</span>} />
        <Row label={w('footer')} value={draft.footer} />
        <Row label={w('printer')} value={draft.printer ? draft.printer.replace('mm', ' mm') : w('printerDefault')} />
        <Row label={w('steps.hours')} value={hours} />
        <Row
          label={w('steps.data')}
          value={
            copy.mode === 'copy'
              ? `${w('dataCopy')} - ${sourceName}: ${COPY_GROUPS.filter((g) => copy.groups.includes(g.key))
                  .map((g) => w(`groups.${g.key}`))
                  .join('، ')}`
              : w('dataEmpty')
          }
        />
      </dl>
      <p className={`text-xs ${MUTED}`}>{w('reviewNote')}</p>
    </div>
  )
}

export function DoneStep({
  branch,
  warehouseName,
  copy,
}: {
  branch: BranchRecord
  warehouseName: string
  copy?: WizardCopyTypeResult[]
}) {
  const w = useTranslations('branches.wizard')
  const t = useTranslations('branches')
  const item = (icon: React.ReactNode, text: string, sub?: string) => (
    <li className={`flex items-start gap-3 p-3 ${CARD}`}>
      <span className="mt-0.5 text-posCloud-success">{icon}</span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${STRONG}`}>{text}</p>
        {sub && <p className={`text-xs ${MUTED}`}>{sub}</p>}
      </div>
    </li>
  )
  const label = (type: string) => (w.has(`types.${type}`) ? w(`types.${type}`) : type)
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <ul className="space-y-2">
        {item(<Building2 className="h-4 w-4" aria-hidden="true" />, w('doneBranch', { name: branch.name }), branch.short_code ?? undefined)}
        {item(<Warehouse className="h-4 w-4" aria-hidden="true" />, w('doneWarehouse'), warehouseName)}
        {item(<BookOpenCheck className="h-4 w-4" aria-hidden="true" />, w('doneAccounting'), w('doneAccountingHint'))}
      </ul>
      {copy && copy.length > 0 && (
        <div className={`${CARD} p-3 space-y-2`}>
          <p className={`text-sm font-medium ${STRONG}`}>{w('doneCopyTitle')}</p>
          <ul className="space-y-1.5">
            {copy.map((r) => (
              <li key={r.entity_type} className="flex items-start gap-2 text-sm">
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-posCloud-success" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-posCloud-warning" aria-hidden="true" />
                )}
                <span className={STRONG}>
                  {label(r.entity_type)}
                  <span className={`ms-2 text-xs tabular-nums ${MUTED}`}>
                    {w('copyCounts', { created: r.created, skipped: r.skipped, failed: r.failed })}
                  </span>
                  {!r.ok && r.error && <span className="block text-xs text-posCloud-danger">{r.error}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className={`text-xs ${MUTED}`}>{w('copyStockNote')}</p>
        </div>
      )}
      <p className={`text-xs ${MUTED}`}>{t('wizard.doneLater')}</p>
    </div>
  )
}

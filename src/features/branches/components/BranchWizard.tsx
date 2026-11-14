'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/shared/ui/sheet'
import { ApiError } from '@/lib/api'
import type { BranchRecord, WizardCopyTypeResult } from '../api/branches.api'
import { useCreateBranch } from '../hooks/useBranchesAdmin'
import {
  BranchDraft,
  COPY_GROUPS,
  CopyGroupKey,
  FieldErrors,
  buildProfile,
  emptyDraft,
  hasErrors,
  validateHours,
  validateIdentity,
  validateTax,
} from '../lib/branch-draft'
import { HoursStep, IdentityStep, TaxStep, WarehouseStep } from './BranchProfileSteps'
import { DataStep, ReviewStep, DoneStep, CopyState } from './BranchWizardSummary'

const STEPS = ['identity', 'warehouse', 'tax', 'hours', 'data', 'review'] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: BranchRecord[]
  /** True when branch isolation is ON (the copy option is only offered then). */
  isolationEnabled: boolean
  /** True for central users (owner): only they may copy from another branch. */
  isCentral: boolean
}

export function BranchWizard({ open, onOpenChange, branches, isolationEnabled, isCentral }: Props) {
  const t = useTranslations('branches')
  const w = useTranslations('branches.wizard')
  const create = useCreateBranch()
  const submitting = useRef(false)

  const activeBranches = useMemo(() => branches.filter((b) => b.is_active), [branches])
  const canCopy = isolationEnabled && isCentral && activeBranches.length > 0
  const mainId = activeBranches.find((b) => b.is_main)?.id ?? activeBranches[0]?.id ?? ''

  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [draft, setDraft] = useState<BranchDraft>(emptyDraft)
  const [copy, setCopy] = useState<CopyState>({ mode: 'empty', sourceId: '', groups: [] })
  const [showErrors, setShowErrors] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ branch: BranchRecord; copy?: WizardCopyTypeResult[] } | null>(null)

  const patch = (p: Partial<BranchDraft>) => setDraft((d) => ({ ...d, ...p }))
  const effectiveSource = copy.sourceId || mainId
  const defaultWarehouse = w('warehouseDefault', { name: draft.name.trim() || '...' })
  const warehouseName = (draft.warehouseTouched ? draft.warehouseName : defaultWarehouse).trim()

  const errorsFor = (s: number): FieldErrors => {
    switch (STEPS[s]) {
      case 'identity':
        return validateIdentity(draft, branches)
      case 'warehouse':
        return warehouseName ? {} : { warehouse: 'warehouseRequired' }
      case 'tax':
        return validateTax(draft)
      case 'hours':
        return validateHours(draft)
      case 'data':
        return copy.mode === 'copy' && (copy.groups.length === 0 || !effectiveSource) ? { groups: 'groupsRequired' } : {}
      default:
        return {}
    }
  }
  const errors = showErrors ? errorsFor(step) : {}

  const reset = () => {
    setStep(0)
    setMaxStep(0)
    setDraft(emptyDraft())
    setCopy({ mode: 'empty', sourceId: '', groups: [] })
    setShowErrors(false)
    setServerError(null)
    setCreated(null)
    submitting.current = false
  }

  const close = (v: boolean) => {
    if (!v && create.isPending) return
    onOpenChange(v)
    if (!v) setTimeout(reset, 200)
  }

  const next = () => {
    if (hasErrors(errorsFor(step))) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setStep((s) => s + 1)
    setMaxStep((m) => Math.max(m, step + 1))
  }
  const back = () => {
    setShowErrors(false)
    setServerError(null)
    setStep((s) => Math.max(0, s - 1))
  }
  const goTo = (s: number) => {
    if (s <= maxStep && !create.isPending) {
      setShowErrors(false)
      setStep(s)
    }
  }

  const submit = () => {
    if (submitting.current || create.isPending) return
    // Re-validate every step: the user may have jumped back and edited.
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (hasErrors(errorsFor(i))) {
        setStep(i)
        setShowErrors(true)
        return
      }
    }
    submitting.current = true
    setServerError(null)
    const types =
      copy.mode === 'copy' ? COPY_GROUPS.filter((g) => copy.groups.includes(g.key)).flatMap((g) => [...g.types]) : []
    create.mutate(
      {
        name: draft.name.trim(),
        address: draft.address.trim() || undefined,
        warehouse_name: warehouseName,
        ...buildProfile(draft, false),
        ...(types.length ? { wizard_copy: { source_branch_id: effectiveSource, entity_types: types } } : {}),
      },
      {
        onSuccess: (res) => {
          const { wizard_copy, ...branch } = res
          setCreated({ branch: branch as BranchRecord, copy: wizard_copy })
          toast.success(t('saved'))
        },
        onError: (err) => {
          submitting.current = false
          const msg = err instanceof ApiError ? err.message : t('saveFailed')
          setServerError(msg)
          // Send the user to the step that owns the likely cause.
          if (/short code|short_code/i.test(msg) || /الرمز المختصر/.test(msg)) setStep(0)
        },
      },
    )
  }

  const toggleGroup = (k: CopyGroupKey) =>
    setCopy((c) => ({ ...c, groups: c.groups.includes(k) ? c.groups.filter((x) => x !== k) : [...c.groups, k] }))

  const isLast = step === STEPS.length - 1

  return (
    <Sheet open={open} onOpenChange={close} modal={false}>
      <SheetContent side="end" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('addTitle')}</SheetTitle>
          <SheetDescription>{created ? w('doneSubtitle') : w('subtitle')}</SheetDescription>
        </SheetHeader>

        {!created && (
          <nav aria-label={w('progress')} className="px-6 pt-4">
            <p className="sm:hidden mb-2 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums">
              {w('stepOf', { n: step + 1, total: STEPS.length })} · {w(`steps.${STEPS[step]}`)}
            </p>
            <ol className="flex items-center gap-1.5">
              {STEPS.map((s, i) => {
                const done = i < step
                const current = i === step
                return (
                  <li key={s} className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={i > maxStep || create.isPending}
                      aria-current={current ? 'step' : undefined}
                      aria-label={`${i + 1}. ${w(`steps.${s}`)}`}
                      className="group flex w-full flex-col gap-1.5 text-start disabled:cursor-not-allowed"
                    >
                      <span
                        className={`h-1.5 w-full rounded-full transition-colors ${
                          current || done
                            ? 'bg-posCloud-primary'
                            : 'bg-posCloud-border dark:bg-posCloudDark-border'
                        } ${current ? 'opacity-100' : done ? 'opacity-60' : ''}`}
                      />
                      <span
                        className={`hidden sm:flex items-center gap-1 truncate text-[11px] ${
                          current
                            ? 'font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary'
                            : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
                        }`}
                      >
                        {done ? <Check className="h-3 w-3 text-posCloud-success" aria-hidden="true" /> : <span className="tabular-nums">{i + 1}</span>}
                        <span className="truncate">{w(`steps.${s}`)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <SheetBody className="space-y-4">
          {created ? (
            <DoneStep branch={created.branch} warehouseName={warehouseName} copy={created.copy} />
          ) : (
            <fieldset disabled={create.isPending} className="space-y-4 border-0 p-0 m-0 min-w-0">
              <div>
                <h3 className="text-base font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                  {w(`steps.${STEPS[step]}`)}
                </h3>
                <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {w(`stepHints.${STEPS[step]}`)}
                </p>
              </div>
              {STEPS[step] === 'identity' && <IdentityStep draft={draft} patch={patch} errors={errors} />}
              {STEPS[step] === 'warehouse' && (
                <>
                  <WarehouseStep draft={draft} patch={patch} defaultName={defaultWarehouse} />
                  {errors.warehouse && (
                    <p role="alert" className="text-xs text-posCloud-danger">
                      {w('errors.warehouseRequired')}
                    </p>
                  )}
                </>
              )}
              {STEPS[step] === 'tax' && <TaxStep draft={draft} patch={patch} errors={errors} />}
              {STEPS[step] === 'hours' && <HoursStep draft={draft} patch={patch} errors={errors} />}
              {STEPS[step] === 'data' && (
                <DataStep
                  canCopy={canCopy}
                  branches={activeBranches}
                  state={{ ...copy, sourceId: effectiveSource }}
                  onMode={(mode) => setCopy((c) => ({ ...c, mode }))}
                  onSource={(sourceId) => setCopy((c) => ({ ...c, sourceId }))}
                  onToggle={toggleGroup}
                  error={errors.groups ? w('errors.groupsRequired') : undefined}
                />
              )}
              {STEPS[step] === 'review' && (
                <ReviewStep
                  draft={draft}
                  warehouseName={warehouseName}
                  copy={{ ...copy, sourceId: effectiveSource }}
                  sourceName={activeBranches.find((b) => b.id === effectiveSource)?.name ?? ''}
                />
              )}
            </fieldset>
          )}

          {create.isPending && (
            <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {copy.mode === 'copy' ? t('creatingWithCopy') : t('creating')}
            </p>
          )}
          {serverError && !created && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/10 p-3 text-sm text-posCloud-danger">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              {serverError}
            </p>
          )}
        </SheetBody>

        <SheetFooter>
          {created ? (
            <Button onClick={() => close(false)}>
              <CheckCircle2 className="h-4 w-4" />
              {w('finish')}
            </Button>
          ) : (
            <>
              <Button variant="outline" disabled={create.isPending} onClick={step === 0 ? () => close(false) : back}>
                {step > 0 && <ChevronRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />}
                {step === 0 ? t('cancel') : w('back')}
              </Button>
              {isLast ? (
                <Button onClick={submit} disabled={create.isPending}>
                  {create.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {w('create')}
                </Button>
              ) : (
                <Button onClick={next}>
                  {w('next')}
                  <ChevronLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
                </Button>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

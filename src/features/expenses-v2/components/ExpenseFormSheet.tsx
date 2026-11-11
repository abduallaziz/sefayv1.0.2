'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { UploadCloud, Paperclip, X, Repeat, ClipboardList, Wallet, Save } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/shared/ui/sheet'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { ApiError } from '@/lib/api'
import { useExpenseDepartments } from '../hooks/useExpenseDepartments'
import { useExpenseCategoriesV2 } from '../hooks/useExpenseCategories'
import { useCreateExpense, useUpdateExpense, useExpenseAttachments, useUploadAttachment } from '../hooks/useExpensesCore'
import { useProfile } from '@/features/settings/hooks/useSettings'
import { useShifts } from '@/features/shifts/hooks/useShifts'
import { formatDateTime } from '@/lib/format'
import { ExpenseRecord, TaxMode, PaymentStatus, RecurringFrequency } from '../api/expenses-v2.api'

// Mirrors the backend's authoritative computeTax() (expenses-v2.service.ts)
// — display-only preview; the server always recomputes on submit, this
// never becomes the source of truth.
function previewTax(enteredAmount: number, taxMode: TaxMode, taxRate: number) {
  if (isNaN(enteredAmount) || enteredAmount < 0) {
    return { amount: 0, tax: 0, total: 0 }
  }
  if (taxMode === 'none') {
    return { amount: enteredAmount, tax: 0, total: enteredAmount }
  }
  if (taxMode === 'exclusive') {
    const tax = Math.round(enteredAmount * taxRate * 100) / 100
    return { amount: enteredAmount, tax, total: Math.round((enteredAmount + tax) * 100) / 100 }
  }
  const amount = Math.round((enteredAmount / (1 + taxRate)) * 100) / 100
  const tax = Math.round((enteredAmount - amount) * 100) / 100
  return { amount, tax, total: enteredAmount }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  editing: ExpenseRecord | null
}

const fieldLabel = 'block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
const ACCEPT = 'image/*,application/pdf'

// Real tokens from tailwind.config.js's posCloud block (not invented):
// primary #2563eb blue, info #7c3aed violet, success #16a34a green — used
// to differentiate sections the same way the reference design does
// (money = green, attachments = violet, everything else = brand blue).
const toneClasses = {
  primary: 'bg-posCloud-primary-light dark:bg-posCloud-primary/10 text-posCloud-primary',
  info: 'bg-posCloud-info-light dark:bg-posCloud-info/10 text-posCloud-info',
  success: 'bg-posCloud-success-light dark:bg-posCloud-success/10 text-posCloud-success',
} as const

function SectionHeading({
  icon: Icon,
  tone = 'primary',
  children,
}: {
  icon: React.ElementType
  tone?: keyof typeof toneClasses
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${toneClasses[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <CardTitle className="text-sm">{children}</CardTitle>
    </div>
  )
}

export function ExpenseFormSheet({ open, onOpenChange, branchId, editing }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="end" className="sm:max-w-2xl">
        {open && (
          // Keyed by the target record so switching between "add" and
          // "edit X" (or between two different edits) fully remounts the
          // form and re-initializes its state from props — no effect-based
          // state sync needed.
          <ExpenseFormBody
            key={editing?.id ?? 'new'}
            branchId={branchId}
            editing={editing}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function ExpenseFormBody({
  branchId,
  editing,
  onDone,
  onCancel,
}: {
  branchId: string
  editing: ExpenseRecord | null
  onDone: () => void
  onCancel: () => void
}) {
  const t = useTranslations('expensesV2.expensesCore.form')
  const tPayment = useTranslations('expensesV2.expensesCore.payment')

  const departments = useExpenseDepartments()
  const categories = useExpenseCategoriesV2()
  const profile = useProfile()
  const taxRate = profile.data?.tax_rate ?? 0
  const createExpense = useCreateExpense(branchId)
  const updateExpense = useUpdateExpense(branchId)
  const uploadAttachment = useUploadAttachment(branchId)
  // Editing an existing Expense: attachments are real, uploaded immediately.
  // Adding a new one: no Expense exists yet, so files are staged
  // client-side and uploaded right after creation succeeds — avoids
  // creating a background/draft Expense before Save is actually pressed.
  const existingAttachments = useExpenseAttachments(editing ? branchId : undefined, editing?.id ?? null)
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toLocaleDateString('en-CA')
  const [expenseDate, setExpenseDate] = useState<string | undefined>(editing?.expense_date ?? today)
  const [departmentId, setDepartmentId] = useState(editing?.department_id ?? '')
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [taxMode, setTaxMode] = useState<TaxMode>(editing?.tax_mode ?? 'exclusive')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [paymentMethod, setPaymentMethod] = useState(editing?.payment_method ?? '')
  const [referenceNumber, setReferenceNumber] = useState(editing?.reference_number ?? '')
  // Phase 5 / T8: which OPEN register the cash came out of ('none' = a safe / petty cash)
  const [registerId, setRegisterId] = useState('none')
  const { data: allShifts } = useShifts()
  const openRegisters = (allShifts ?? []).filter((sh) => sh.status === 'open')
  const showRegisterPicker =
    !editing && paymentMethod === 'cash' && paymentStatus === 'paid' && openRegisters.length > 0
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurringFrequency>(editing?.frequency ?? 'monthly')
  const [endDate, setEndDate] = useState<string | undefined>(editing?.recurring_end_date ?? undefined)

  const amountNum = parseFloat(amount)
  const taxPreview = previewTax(amountNum, taxMode, taxRate)
  const canSubmit =
    !!expenseDate &&
    !!departmentId &&
    !!categoryId &&
    !!title.trim() &&
    !isNaN(amountNum) &&
    amountNum > 0 &&
    !!paymentMethod.trim()

  const isPending = createExpense.isPending || updateExpense.isPending

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (editing) {
      Array.from(files).forEach((file) => {
        uploadAttachment.mutate(
          { expenseId: editing.id, file },
          { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Upload failed') },
        )
      })
    } else {
      setStagedFiles((prev) => [...prev, ...Array.from(files)])
    }
  }

  const uploadStagedFiles = async (expenseId: string) => {
    for (const file of stagedFiles) {
      try {
        await uploadAttachment.mutateAsync({ expenseId, file })
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Upload failed')
      }
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    if (editing) {
      updateExpense.mutate(
        {
          id: editing.id,
          dto: {
            department_id: departmentId,
            category_id: categoryId,
            title: title.trim(),
            description: description.trim() || undefined,
            amount: amountNum,
            tax_mode: taxMode,
            payment_method: paymentMethod.trim(),
            reference_number: referenceNumber.trim() || undefined,
            expense_date: expenseDate,
            ...(editing.is_recurring
              ? { frequency, recurring_end_date: endDate || undefined }
              : {}),
          },
        },
        {
          onSuccess: onDone,
          onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
        },
      )
      return
    }

    createExpense.mutate(
      {
        department_id: departmentId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: amountNum,
        tax_mode: taxMode,
        payment_method: paymentMethod.trim(),
        reference_number: referenceNumber.trim() || undefined,
        payment_status: paymentStatus,
        expense_date: expenseDate,
        ...(showRegisterPicker && registerId !== 'none' ? { shift_id: registerId } : {}),
        ...(isRecurring
          ? { is_recurring: true, frequency, recurring_end_date: endDate || undefined }
          : {}),
      },
      {
        onSuccess: async (created) => {
          await uploadStagedFiles(created.id)
          onDone()
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
      },
    )
  }

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-posCloud-primary text-white shrink-0">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <SheetTitle>{editing ? t('editTitle') : t('addTitle')}</SheetTitle>
            <SheetDescription>{t('subtitle')}</SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <SheetBody className="space-y-4">
        {/* Recurring toggle — Add: fully editable. Edit of an already-
            recurring Expense: shown as context (frequency/end date remain
            editable) but the on/off state itself can't change here — the
            only way to stop recurrence is the dedicated Stop Recurring
            action, matching the locked state-machine rule. Edit of a
            non-recurring Expense: hidden, since recurring can only be
            enabled at creation time. */}
        {(!editing || editing.is_recurring) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${toneClasses.primary}`}>
                    <Repeat className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {t('recurring')}
                    </p>
                    <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-0.5">
                      {t('recurringHint')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={editing ? editing.is_recurring : isRecurring}
                  onCheckedChange={editing ? undefined : setIsRecurring}
                  disabled={!!editing}
                />
              </div>

              {((editing && editing.is_recurring) || (!editing && isRecurring)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className={fieldLabel}>{t('frequency')}</label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('frequencyDaily')}</SelectItem>
                        <SelectItem value="weekly">{t('frequencyWeekly')}</SelectItem>
                        <SelectItem value="monthly">{t('frequencyMonthly')}</SelectItem>
                        <SelectItem value="yearly">{t('frequencyYearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={fieldLabel}>{t('endDate')}</label>
                    <SingleDatePicker value={endDate} onChange={setEndDate} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="p-4 pb-0">
            <SectionHeading icon={ClipboardList}>{t('sectionBasicInfo')}</SectionHeading>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel}>{t('category')}</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={fieldLabel}>{t('department')}</label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.data?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel}>{t('date')}</label>
                <SingleDatePicker value={expenseDate} onChange={setExpenseDate} />
              </div>
              <div>
                <label className={fieldLabel}>{t('paymentMethod')}</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectPaymentMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('paymentMethodCash')}</SelectItem>
                    <SelectItem value="card">{t('paymentMethodCard')}</SelectItem>
                    <SelectItem value="bank_transfer">{t('paymentMethodBankTransfer')}</SelectItem>
                    <SelectItem value="cheque">{t('paymentMethodCheque')}</SelectItem>
                    <SelectItem value="other">{t('paymentMethodOther')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showRegisterPicker && (
              <div>
                <label className={fieldLabel}>{t('registerLabel')}</label>
                <Select value={registerId} onValueChange={setRegisterId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('registerNone')}</SelectItem>
                    {openRegisters.map((sh) => (
                      <SelectItem key={sh.id} value={sh.id}>
                        {(sh.cashier_name ?? '—') + ' · ' + formatDateTime(sh.opened_at)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">{t('registerHint')}</p>
              </div>
            )}

            <div>
              <label className={fieldLabel}>{t('referenceNumber')}</label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={t('referenceNumberPlaceholder')}
              />
            </div>

            <div>
              <label className={fieldLabel}>{t('title')}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} />
            </div>

            <div>
              <label className={fieldLabel}>{t('description')}</label>
              <textarea
                className="flex w-full rounded border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 py-2 text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary placeholder:text-posCloud-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-0">
            <SectionHeading icon={Paperclip} tone="info">{t('sectionAttachments')}</SectionHeading>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                addFiles(e.dataTransfer.files)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-posCloud-primary bg-posCloud-primary/5'
                  : 'border-posCloud-border dark:border-posCloudDark-border'
              }`}
            >
              <UploadCloud className="h-8 w-8 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
              <p className="text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                {t('dragDropHint')}
              </p>
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('fileTypesHint')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                {t('browseFiles')}
              </Button>
            </div>

            {editing ? (
              existingAttachments.data && existingAttachments.data.length > 0 && (
                <div>
                  <p className={fieldLabel}>
                    {t('attachedFiles')} ({existingAttachments.data.length})
                  </p>
                  <ul className="space-y-1">
                    {existingAttachments.data.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:bg-posCloud-sidebar dark:hover:bg-posCloudDark-background transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0" />
                          <span className="truncate">{a.storage_path.split('/').pop()}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : (
              stagedFiles.length > 0 && (
                <div>
                  <p className={fieldLabel}>
                    {t('attachedFiles')} ({stagedFiles.length})
                  </p>
                  <ul className="space-y-1">
                    {stagedFiles.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary"
                      >
                        <Paperclip className="h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0" />
                        <span className="truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title={t('removeAttachment')}
                          onClick={() => setStagedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-0">
            <SectionHeading icon={Wallet} tone="success">{t('sectionAmountPayment')}</SectionHeading>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className={fieldLabel}>{t('amount')}</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="tabular-nums pe-14"
                />
                <span className="absolute inset-y-0 end-3 flex items-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary pointer-events-none">
                  {t('currency')}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background p-3 space-y-2">
              <div className="flex items-center justify-between text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                <span>{t('taxBreakdownAmount')}</span>
                <span className="tabular-nums">
                  {taxPreview.amount.toFixed(2)} {t('currency')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                <span>
                  {t('taxBreakdownTax')} ({Math.round(taxRate * 100)}%)
                </span>
                <span className="tabular-nums">
                  {taxPreview.tax.toFixed(2)} {t('currency')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-posCloud-border dark:border-posCloudDark-border">
                <span className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                  {t('taxBreakdownTotal')}
                </span>
                <span className="text-lg font-bold text-posCloud-primary tabular-nums">
                  {taxPreview.total.toFixed(2)} {t('currency')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel}>{t('taxMode')}</label>
                <Select value={taxMode} onValueChange={(v) => setTaxMode(v as TaxMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('taxModeNone')}</SelectItem>
                    <SelectItem value="inclusive">{t('taxModeInclusive')}</SelectItem>
                    <SelectItem value="exclusive">{t('taxModeExclusive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!editing && (
                <div>
                  <label className={fieldLabel}>{t('paymentStatus')}</label>
                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectPaymentStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">{tPayment('paid')}</SelectItem>
                      <SelectItem value="unpaid">{tPayment('unpaid')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
          <Save className="h-4 w-4" />
          {editing ? t('saveChanges') : t('saveExpense')}
        </Button>
      </SheetFooter>
    </>
  )
}

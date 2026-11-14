'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, Search, Pencil, Pause, Play, Trash2, Building2, AlertTriangle, MapPin, CalendarDays, Warehouse, Filter, ShieldAlert, ArrowUpCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { StatusBadge } from '@/shared/ui/status-badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/shared/ui/sheet'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { ApiError } from '@/lib/api'
import { useUsage, useSubscription } from '@/features/settings/hooks/useSettings'
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses'
import { useBranchesAdmin, useCreateBranch, useUpdateBranch, useDeleteBranch } from '../hooks/useBranchesAdmin'
import { BranchRecord } from '../api/branches.api'

// Statuses BillingService.checkBranchLimit() treats as a valid, capacity-bearing
// subscription (billing.types.ts SubscriptionStatus). Kept in sync manually —
// mirrors the backend's own valid-status set rather than re-deriving it, since
// there is no shared enum between the two apps.
const VALID_SUBSCRIPTION_STATUSES = ['trial', 'active', 'grace_period']

const ALL = '__all__'
const PAGE_SIZE = 10

// Branch Management — Branch System Step 1 (Owner-approved). Uses the
// existing `/branches` backend CRUD exactly as it already exists today:
// list/create/edit/activate/deactivate, existing branches.view/manage
// permissions, existing plan-limit enforcement on create. No backend
// change, no new permission, no schema change accompanies this page.
export function BranchesPage() {
  const t = useTranslations('branches')
  const locale = useLocale()
  const canView = usePermission('branches.view')
  const canManage = usePermission('branches.manage')

  const branches = useBranchesAdmin()
  const usage = useUsage()
  const subscription = useSubscription()
  const warehouses = useWarehouses()
  const createBranch = useCreateBranch()
  const updateBranch = useUpdateBranch()
  const deleteBranch = useDeleteBranch()
  const [toDelete, setToDelete] = useState<BranchRecord | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const warehouseNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const w of warehouses.data ?? []) map.set(w.id, w.name)
    return map
  }, [warehouses.data])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [page, setPage] = useState(1)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<BranchRecord | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const openCreate = () => {
    setEditing(null)
    setName('')
    setAddress('')
    setNameError(null)
    setSheetOpen(true)
  }
  const openEdit = (b: BranchRecord) => {
    setEditing(b)
    setName(b.name)
    setAddress(b.address ?? '')
    setNameError(null)
    setSheetOpen(true)
  }

  const handleSave = () => {
    if (createBranch.isPending || updateBranch.isPending) return
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError(t('nameRequired'))
      return
    }
    if (trimmed.length > 100) {
      setNameError(t('nameTooLong'))
      return
    }
    const lower = trimmed.toLowerCase()
    if ((branches.data ?? []).some((b) => b.id !== editing?.id && b.name.trim().toLowerCase() === lower)) {
      setNameError(t('nameDuplicate'))
      return
    }
    setNameError(null)
    const dto = { name: trimmed, address: address.trim() || undefined }
    const opts = {
      onSuccess: () => {
        setSheetOpen(false)
        toast.success(t('saved'))
      },
      onError: (err: unknown) => {
        setNameError(err instanceof ApiError ? err.message : t('saveFailed'))
      },
    }
    if (editing) updateBranch.mutate({ id: editing.id, dto }, opts)
    else createBranch.mutate(dto, opts)
  }

  const confirmDelete = () => {
    if (!toDelete) return
    deleteBranch.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(t('deleted'))
        setToDelete(null)
      },
      onError: () => setToDelete(null),
    })
  }

  const toggleActive = (b: BranchRecord) => {
    updateBranch.mutate(
      { id: b.id, dto: { is_active: !b.is_active } },
      {
        onSuccess: () => toast.success(b.is_active ? t('deactivated') : t('activated')),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : t('saveFailed')),
      },
    )
  }

  const filtered = useMemo(() => {
    let rows = branches.data ?? []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((b) => b.name.toLowerCase().includes(q) || (b.address ?? '').toLowerCase().includes(q))
    }
    if (statusFilter !== ALL) {
      rows = rows.filter((b) => (statusFilter === 'active' ? b.is_active : !b.is_active))
    }
    return rows
  }, [branches.data, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeCount = (branches.data ?? []).filter((b) => b.is_active).length

  if (!canView) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState icon={AlertTriangle} title={t('noPermission')} theme="dashboard" size="lg" />
      </div>
    )
  }

  const branchesUsage = usage.data?.branches
  const sub = subscription.data?.subscription
  // Same status set BillingService.checkBranchLimit() accepts. A missing
  // subscription, or one that's cancelled/suspended/expired, means the
  // backend's active-subscription resolution found nothing — capacity is
  // effectively 0 no matter what number `branchesUsage.limit` holds.
  const hasValidSubscription = !!sub && VALID_SUBSCRIPTION_STATUSES.includes(sub.status)
  const isUnlimited = hasValidSubscription && branchesUsage?.limit == null
  const atCapacity =
    hasValidSubscription && branchesUsage?.limit != null && branchesUsage.used >= branchesUsage.limit
  const canAddBranch = canManage && hasValidSubscription && !atCapacity && !usage.isLoading && !subscription.isLoading

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-start">
          <h1 className="text-xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>
          <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('description')}</p>
        </div>

        <div className="flex items-center gap-3">
          {hasValidSubscription && atCapacity ? (
            // Maximum-capacity state: a prominent, self-contained callout —
            // distinct from the plain suspended-subscription pill below,
            // per Owner's explicit requirement that this state read clearly
            // as "your plan is full," not just another muted status line.
            <div className="flex items-center gap-3 rounded-2xl border border-posCloud-warning/40 bg-posCloud-warning-light dark:bg-posCloud-warning/10 px-4 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-posCloud-warning/20 text-posCloud-warning shrink-0">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary leading-tight">
                  {t('planAtCapacity')}
                </p>
                <p className="text-[11px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums leading-tight">
                  {branchesUsage?.used ?? 0} / {branchesUsage?.limit ?? 0} {t('activeCount')}
                </p>
              </div>
              <Button variant="warning" size="sm" asChild className="ms-2">
                <Link href={`/${locale}/dashboard/settings`}>
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  {t('buyAdditionalBranch')}
                </Link>
              </Button>
            </div>
          ) : (
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${
                !hasValidSubscription
                  ? 'border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/10'
                  : 'border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                  !hasValidSubscription
                    ? 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger'
                    : 'bg-posCloud-success-light dark:bg-posCloud-success/10 text-posCloud-success'
                }`}
              >
                {hasValidSubscription ? <Building2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-lg font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums whitespace-nowrap leading-tight">
                  {!hasValidSubscription
                    ? (branches.data ?? []).length
                    : isUnlimited
                      ? (branches.data ?? []).length
                      : `${branchesUsage?.used ?? 0} / ${branchesUsage?.limit ?? 0}`}
                </p>
                <p className="text-[11px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary whitespace-nowrap leading-tight">
                  {!hasValidSubscription
                    ? t('planAtCapacity')
                    : `${t('totalCount')} · ${activeCount} ${t('activeCount')}`}
                </p>
              </div>
            </div>
          )}

          {canManage && canAddBranch && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('addNew')}
            </Button>
          )}

          {canManage && !hasValidSubscription && !usage.isLoading && !subscription.isLoading && (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/settings`}>
                <ArrowUpCircle className="h-4 w-4" />
                {t('buyAdditionalBranch')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="rounded-xl">
              <Filter className="h-3.5 w-3.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary me-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('searchPlaceholder')}
            className="rounded-xl ps-9"
          />
        </div>
      </div>

      {branches.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-posCloud-background dark:bg-posCloudDark-border animate-pulse" />
          ))}
        </div>
      ) : pageRows.length === 0 ? (
        <EmptyState icon={Building2} title={(branches.data ?? []).length > 0 ? t('noResults') : t('empty')} theme="dashboard" size="sm" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageRows.map((b) => (
            <Card key={b.id} className="overflow-hidden border-posCloud-border dark:border-posCloudDark-border shadow-sm">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <StatusBadge label={b.is_active ? t('active') : t('inactive')} tone={b.is_active ? 'success' : 'neutral'} />
                  <div className="flex items-start gap-3 min-w-0 flex-row-reverse text-end">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-posCloud-primary-light dark:bg-posCloud-primary/10 text-posCloud-primary shrink-0">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <p className="font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate pt-2">
                      {b.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-posCloud-border dark:divide-posCloudDark-border rtl:divide-x-reverse rounded-xl border border-posCloud-border dark:border-posCloudDark-border">
                  <div className="flex flex-col items-center gap-1 p-3 text-center">
                    <Warehouse className="h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
                    <span className="text-[11px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('warehouseTile')}</span>
                    <span className="text-xs font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate w-full">
                      {b.default_warehouse_id ? (warehouseNameById.get(b.default_warehouse_id) ?? t('noWarehouse')) : t('noWarehouse')}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-3 text-center">
                    <CalendarDays className="h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
                    <span className="text-[11px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('createdTile')}</span>
                    <span className="text-xs font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate w-full">
                      {new Date(b.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-CA')}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary rounded-xl border border-posCloud-border dark:border-posCloudDark-border p-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('columnAddress')}</p>
                    <span className="line-clamp-2">{b.address || t('noAddress')}</span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2 pt-2 border-t border-posCloud-border dark:border-posCloudDark-border">
                    {b.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg text-posCloud-danger hover:text-posCloud-danger"
                        onClick={() => toggleActive(b)}
                      >
                        <Pause className="h-3.5 w-3.5" />
                        {t('deactivate')}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg text-posCloud-success hover:text-posCloud-success"
                        onClick={() => toggleActive(b)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        {t('activate')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => openEdit(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                      {t('editTitle')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-posCloud-danger hover:text-posCloud-danger"
                      aria-label={t('deleteBranch')}
                      title={t('deleteBranch')}
                      onClick={() => setToDelete(b)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            {t('pageOf', { page, total: totalPages })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('previous')}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
        <SheetContent side="end">
          <SheetHeader>
            <SheetTitle>{editing ? t('editTitle') : t('addTitle')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('name')}
              </label>
              <Input
                value={name}
                maxLength={100}
                aria-invalid={!!nameError}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                placeholder={t('namePlaceholder')}
              />
              {nameError && (
                <p role="alert" className="mt-1.5 text-xs text-posCloud-danger">
                  {nameError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('address')}
              </label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('addressPlaceholder')} />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={createBranch.isPending || updateBranch.isPending}>
              {t('save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={t('deleteTitle')}
        message={t('deleteConfirm', { name: toDelete?.name ?? '' })}
        confirmLabel={t('deleteBranch')}
        cancelLabel={t('cancel')}
        isLoading={deleteBranch.isPending}
      />
    </div>
  )
}

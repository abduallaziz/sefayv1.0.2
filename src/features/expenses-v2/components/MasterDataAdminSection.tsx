'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Pause, Play, FolderOpen } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/status-badge'
import { DataTable, type Column } from '@/shared/ui/data-table'
import { EmptyState } from '@/shared/ui/empty-state'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/shared/ui/sheet'
import { ApiError } from '@/lib/api'
import { ExpenseMasterRecord } from '../api/expenses-v2.api'

const ALL = '__all__'
const PAGE_SIZE = 10

interface Props {
  namespace: 'departmentsAdmin' | 'categoriesAdmin'
  icon: React.ElementType
  records: ExpenseMasterRecord[]
  isLoading: boolean
  canManage: boolean
  // Count of Expenses currently referencing each record, scoped to the
  // active branch (Departments/Categories are tenant-wide but Expenses are
  // branch-scoped — there is no tenant-wide aggregate endpoint, so this
  // reflects the branch the caller has selected, not the whole tenant).
  expenseCountById: Map<string, number>
  creating: boolean
  updating: boolean
  onCreate: (name: string, code?: string) => void
  onUpdate: (id: string, name: string, code?: string) => void
  onDeactivate: (id: string) => void
  onReactivate: (id: string) => void
}

export function MasterDataAdminSection({
  namespace,
  icon: Icon,
  records,
  isLoading,
  canManage,
  expenseCountById,
  creating,
  updating,
  onCreate,
  onUpdate,
  onDeactivate,
  onReactivate,
}: Props) {
  const t = useTranslations(`expensesV2.${namespace}`)
  const tBreadcrumb = useTranslations('expensesV2.breadcrumb')
  const locale = useLocale()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [page, setPage] = useState(1)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseMasterRecord | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const openCreate = () => {
    setEditing(null)
    setName('')
    setCode('')
    setSheetOpen(true)
  }
  const openEdit = (r: ExpenseMasterRecord) => {
    setEditing(r)
    setName(r.name)
    setCode(r.code ?? '')
    setSheetOpen(true)
  }
  const handleSave = () => {
    if (!name.trim()) return
    if (editing) {
      onUpdate(editing.id, name.trim(), code.trim() || undefined)
    } else {
      onCreate(name.trim(), code.trim() || undefined)
    }
    setSheetOpen(false)
  }

  const filtered = useMemo(() => {
    let rows = records
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || (r.code ?? '').toLowerCase().includes(q))
    }
    if (statusFilter !== ALL) {
      rows = rows.filter((r) => (statusFilter === 'active' ? r.is_active : !r.is_active))
    }
    return rows
  }, [records, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeCount = records.filter((r) => r.is_active).length

  const columns: Column<ExpenseMasterRecord>[] = [
    {
      key: 'name',
      header: t('columnName'),
      render: (r) => (
        <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{r.name}</span>
      ),
    },
    {
      key: 'code',
      header: t('columnCode'),
      render: (r) => r.code ?? '—',
    },
    {
      key: 'status',
      header: t('columnStatus'),
      render: (r) => (
        <StatusBadge label={r.is_active ? t('active') : t('inactive')} tone={r.is_active ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'expenseCount',
      header: t('columnExpenseCount'),
      render: (r) => expenseCountById.get(r.id) ?? 0,
    },
    {
      key: 'createdAt',
      header: t('columnCreatedAt'),
      render: (r) => new Date(r.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-CA'),
    },
    {
      key: 'actions',
      header: t('columnActions'),
      render: (r) =>
        canManage && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title={t('edit')} onClick={() => openEdit(r)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {r.is_active ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-posCloud-danger hover:text-posCloud-danger"
                title={t('deactivate')}
                onClick={() => onDeactivate(r.id)}
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-posCloud-success hover:text-posCloud-success"
                title={t('reactivate')}
                onClick={() => onReactivate(r.id)}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumb={[
          { label: tBreadcrumb('home'), href: `/${locale}/dashboard` },
          { label: tBreadcrumb('expenses'), href: `/${locale}/dashboard/expenses-v2/expenses` },
          { label: t('title') },
        ]}
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('addNew')}
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <Card className="flex-1 min-w-[220px]">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-posCloud-primary-light dark:bg-posCloud-primary/10 text-posCloud-primary shrink-0">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums">
                {records.length}
              </p>
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('totalCount')} · {activeCount} {t('activeCount')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                <Search className="inline h-3 w-3 me-1" />
              </label>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={t('searchPlaceholder')}
              />
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('statusFilter')}
              </label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={pageRows}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        theme="dashboard"
        emptyState={<EmptyState icon={FolderOpen} title={t('empty')} theme="dashboard" size="sm" />}
      />

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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('code')}
              </label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || creating || updating}>
              {t('save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function handleMutationError(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : 'Failed')
}

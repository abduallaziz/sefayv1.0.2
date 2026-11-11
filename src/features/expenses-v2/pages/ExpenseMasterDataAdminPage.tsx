'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Building2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/shared/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { ApiError } from '@/lib/api'
import {
  useExpenseDepartments,
  useCreateExpenseDepartment,
  useUpdateExpenseDepartment,
  useDeactivateExpenseDepartment,
} from '../hooks/useExpenseDepartments'
import {
  useExpenseCategoriesV2,
  useCreateExpenseCategoryV2,
  useUpdateExpenseCategoryV2,
  useDeactivateExpenseCategoryV2,
} from '../hooks/useExpenseCategories'
import { useExpenses } from '../hooks/useExpensesCore'
import { MasterDataAdminSection } from '../components/MasterDataAdminSection'
import { ExpensesSectionNav } from '../components/ExpensesSectionNav'

// Step 3 (Department + Category administration), redesigned per the Owner-
// approved Departments/Categories Management mockups. Departments and
// Categories remain two independent, unrelated master-data lists (no FK
// between them) — the "expense count" column shown for each row counts
// Expenses in the currently selected branch that reference that record,
// since Expenses are branch-scoped and there is no tenant-wide aggregate
// endpoint to count across all branches at once (Owner-approved fallback,
// not a fabricated number).
export function ExpenseMasterDataAdminPage() {
  const t = useTranslations('expensesV2')
  const canView = usePermission('expenses.view')
  const canManage = usePermission('expenses.configure')

  const { availableBranches, currentBranchId, setCurrentBranch, isCentral } = useBranchContext()
  const activeBranchId = currentBranchId ?? undefined

  const departments = useExpenseDepartments(true)
  const createDepartment = useCreateExpenseDepartment()
  const updateDepartment = useUpdateExpenseDepartment()
  const deactivateDepartment = useDeactivateExpenseDepartment()

  const categories = useExpenseCategoriesV2(true)
  const createCategory = useCreateExpenseCategoryV2()
  const updateCategory = useUpdateExpenseCategoryV2()
  const deactivateCategory = useDeactivateExpenseCategoryV2()

  const expenses = useExpenses(activeBranchId, {})

  const departmentCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses.data ?? []) {
      map.set(e.department_id, (map.get(e.department_id) ?? 0) + 1)
    }
    return map
  }, [expenses.data])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses.data ?? []) {
      map.set(e.category_id, (map.get(e.category_id) ?? 0) + 1)
    }
    return map
  }, [expenses.data])

  if (!canView) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState icon={AlertTriangle} title={t('departmentsAdmin.noPermission')} theme="dashboard" size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-8">
      <ExpensesSectionNav />
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary shrink-0">
          {t('departmentsAdmin.workingBranch')}
        </span>
        <Select value={activeBranchId ?? ''} onValueChange={setCurrentBranch} disabled={!isCentral}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div id="departments" className="scroll-mt-24">
      <MasterDataAdminSection
        namespace="departmentsAdmin"
        icon={Building2}
        records={departments.data ?? []}
        isLoading={departments.isLoading}
        canManage={canManage}
        expenseCountById={departmentCounts}
        creating={createDepartment.isPending}
        updating={updateDepartment.isPending}
        onCreate={(name, code) =>
          createDepartment.mutate({ name, code }, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })
        }
        onUpdate={(id, name, code) =>
          updateDepartment.mutate({ id, dto: { name, code } }, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })
        }
        onDeactivate={(id) => deactivateDepartment.mutate(id, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })}
        onReactivate={(id) =>
          updateDepartment.mutate({ id, dto: { is_active: true } }, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })
        }
      />
      </div>

      <div id="categories" className="scroll-mt-24">
      <MasterDataAdminSection
        namespace="categoriesAdmin"
        icon={Tag}
        records={categories.data ?? []}
        isLoading={categories.isLoading}
        canManage={canManage}
        expenseCountById={categoryCounts}
        creating={createCategory.isPending}
        updating={updateCategory.isPending}
        onCreate={(name, code) =>
          createCategory.mutate({ name, code }, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })
        }
        onUpdate={(id, name, code) =>
          updateCategory.mutate({ id, dto: { name, code } }, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })
        }
        onDeactivate={(id) => deactivateCategory.mutate(id, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })}
        onReactivate={(id) =>
          updateCategory.mutate({ id, dto: { is_active: true } }, { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') })
        }
      />
      </div>
    </div>
  )
}

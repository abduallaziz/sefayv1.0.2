'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { TableCard } from '../components/TableCard'
import { CreateTableModal } from '../components/CreateTableModal'
import { DineInModal } from '../components/DineInModal'
import { ReservationsTab } from '../components/ReservationsTab'
import { WaitlistTab } from '../components/WaitlistTab'
import { useTablesList, useAllBranchesTableCount } from '../hooks/useTables'

export function TablesPage() {
  const t = useTranslations('tables')
  const [tab, setTab] = useState<'tables' | 'reservations' | 'waitlist'>('tables')
  const [showCreate, setShowCreate] = useState(false)
  // keep only the id: the dialog must follow the live table (opening a table changes its status),
  // a stored copy kept showing "table available" after it had been opened
  const [activeTableId, setActiveTableId] = useState<string | null>(null)

  // The branch the user actually selected (shared branch context), not just
  // the newest branch in the list.
  const { currentBranchId } = useBranchContext()
  const branchId = currentBranchId ?? ''

  const { data: tables = [], isLoading: tablesLoading } = useTablesList(branchId)
  const activeTable = tables.find((x) => x.id === activeTableId) ?? null
  // B-1: an empty branch may simply not be the one that holds the tables
  const { data: allBranchesCount = 0 } = useAllBranchesTableCount(!tablesLoading && tables.length === 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>
        {tab === 'tables' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('newTable')}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['tables', 'reservations', 'waitlist'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tb
                ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5]'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            {t(`tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'tables' && (
        tablesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : tables.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noTables')}</p>
            {allBranchesCount > 0 && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{t('noTablesOtherBranch')}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} onClick={() => setActiveTableId(table.id)} />
            ))}
          </div>
        )
      )}

      {tab === 'reservations' && (
        <ReservationsTab tables={tables} />
      )}

      {tab === 'waitlist' && (
        <WaitlistTab branchId={branchId} tables={tables} />
      )}

      {showCreate && <CreateTableModal branchId={branchId} onClose={() => setShowCreate(false)} />}
      {activeTable && <DineInModal table={activeTable} onClose={() => setActiveTableId(null)} />}
    </div>
  )
}

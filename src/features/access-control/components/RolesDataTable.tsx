'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useLocale } from 'next-intl'
import { RoleSummary } from '../api/access-control.api'
import { RoleStatusBadge } from './RoleStatusBadge'
import { RoleActionsMenu } from './RoleActionsMenu'

const columnHelper = createColumnHelper<RoleSummary>()

interface RolesDataTableProps {
  roles: RoleSummary[]
  onView: (role: RoleSummary) => void
  onEdit: (role: RoleSummary) => void
  onDelete: (role: RoleSummary) => void
}

export function RolesDataTable({ roles, onView, onEdit, onDelete }: RolesDataTableProps) {
  const locale = useLocale()

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Role Name',
        size: 35,
        cell: (info) => (
          <div>
            <p className="font-medium text-slate-900">{info.getValue()}</p>
            {info.row.original.description && (
              <p className="mt-0.5 truncate text-xs text-slate-500">{info.row.original.description}</p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('is_system', {
        id: 'scope',
        header: 'Scope',
        size: 15,
        cell: (info) => <RoleStatusBadge isSystem={info.getValue()} />,
      }),
      columnHelper.accessor('user_count', {
        id: 'active_users',
        header: 'Active Users',
        size: 15,
        cell: (info) => <span className="tabular-nums text-slate-700">{info.getValue()}</span>,
      }),
      columnHelper.accessor('updated_at', {
        header: 'Last Updated',
        size: 20,
        cell: (info) => (
          <span className="text-slate-500">
            {new Date(info.getValue()).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block text-end">Actions</span>,
        size: 15,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RoleActionsMenu role={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>
        ),
      }),
    ],
    [locale, onView, onEdit, onDelete],
  )

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          {table.getAllColumns().map((col) => (
            <col key={col.id} style={{ width: `${col.columnDef.size}%` }} />
          ))}
        </colgroup>
        <thead className="bg-slate-50/75">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-slate-200">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="h-14 hover:bg-slate-50/60">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

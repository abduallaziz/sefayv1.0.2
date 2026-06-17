'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useExpenseCategories, useDeleteCategory, useUpdateCategory } from '../hooks/useExpenses'
import { AddCategoryModal } from './AddCategoryModal'
import type { ExpenseCategory } from '../api/expenses.api'

export function CategoriesList() {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const deleteMutation = useDeleteCategory()
  const updateMutation = useUpdateCategory()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function startEdit(cat: ExpenseCategory) {
    setEditId(cat.id)
    setEditName(cat.name)
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return
    updateMutation.mutate({ id, dto: { name: editName.trim() } }, {
      onSuccess: () => setEditId(null)
    })
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          إضافة فئة
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p>لا توجد فئات — أضف فئة جديدة</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-gray-800">
                <th className="text-start px-4 py-3 text-xs font-medium text-slate-500">الاسم</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    {editId === cat.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(cat.id)}
                        autoFocus
                        className="px-2 py-1 text-sm bg-slate-50 dark:bg-gray-950 border border-[#0C447C] dark:border-blue-500 text-slate-800 dark:text-white rounded-lg focus:outline-none w-40"
                      />
                    ) : (
                      <span className="text-slate-800 dark:text-white font-medium">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                      cat.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                      {cat.is_active ? 'نشط' : 'معطّل'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {editId === cat.id ? (
                        <>
                          <button onClick={() => saveEdit(cat.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: cat.id, dto: { is_active: !cat.is_active } })}
                            className="px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
                          >
                            {cat.is_active ? 'تعطيل' : 'تفعيل'}
                          </button>
                          <button onClick={() => deleteMutation.mutate(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddCategoryModal onClose={() => setShowAdd(false)} />}
    </>
  )
}
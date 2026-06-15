'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useExpenseCategories, useDeleteCategory, useUpdateCategory } from '../hooks/useExpenses'
import { AddCategoryModal } from './AddCategoryModal'

export function CategoriesList() {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const deleteMutation = useDeleteCategory()
  const updateMutation = useUpdateCategory()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          إضافة فئة
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-[#141720] rounded-xl animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p>لا توجد فئات — أضف فئة جديدة</p>
        </div>
      ) : (
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">الاسم</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-[#1e2130] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                      cat.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {cat.is_active ? 'نشط' : 'معطّل'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => updateMutation.mutate({ id: cat.id, dto: { is_active: !cat.is_active } })}
                        className="px-3 py-1 rounded-lg text-xs border border-[#1e2130] text-slate-400 hover:text-white hover:bg-white/5"
                      >
                        {cat.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
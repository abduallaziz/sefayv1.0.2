'use client'

import { useState } from 'react'
import { useCreateCategory } from '../hooks/useExpenses'

interface Props {
  onClose: () => void
}

export function AddCategoryModal({ onClose }: Props) {
  const [name, setName] = useState('')
  const mutation = useCreateCategory()

  function handleSubmit() {
    if (!name.trim()) return
    mutation.mutate({ name: name.trim() }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">إضافة فئة</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">اسم الفئة</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: وقود، قرطاسية..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || mutation.isPending}
            className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {mutation.isPending ? '...' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}
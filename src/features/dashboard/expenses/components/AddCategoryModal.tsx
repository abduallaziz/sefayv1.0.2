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
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">إضافة فئة</h2>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">اسم الفئة</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: وقود، قرطاسية..."
            className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || mutation.isPending}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {mutation.isPending ? '...' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}
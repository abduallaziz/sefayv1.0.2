'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateUser } from '../hooks/useUsers'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const ROLES = ['owner', 'manager', 'cashier', 'worker']

export function CreateUserDialog({ open, onClose }: Props) {
  const t = useTranslations('users')
  const { mutate: createUser, isPending } = useCreateUser()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
  })

  function handleSubmit() {
    if (!form.name || !form.email || !form.password) return
    createUser(form, {
      onSuccess: () => {
        setForm({ name: '', email: '', password: '', role: 'cashier' })
        onClose()
      },
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#0d1117] border border-[#1e2130] rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{t('addUser')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t('name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t('email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t('password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t('role')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[#1e2130] rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.name || !form.email || !form.password}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
          >
            {isPending ? t('creating') : t('create')}
          </button>
        </div>
      </div>
    </div>
  )
}
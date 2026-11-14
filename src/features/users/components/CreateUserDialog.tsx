'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateUser } from '../hooks/useUsers'
import { useBranches } from '@/shared/hooks/useBranches'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const ROLES = ['owner', 'manager', 'cashier', 'worker', 'inventory_clerk']

export function CreateUserDialog({ open, onClose }: Props) {
  const t = useTranslations('users')
  const { mutate: createUser, isPending } = useCreateUser()
  const { data: branches = [] } = useBranches()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    branch_id: '',
  })

  const [touched, setTouched] = useState(false)
  const errors = {
    name: form.name.trim() ? '' : t('errName'),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? '' : t('errEmail'),
    password: form.password.length >= 8 ? '' : t('errPasswordShort'),
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleSubmit() {
    setTouched(true)
    if (errors.name || errors.email || errors.password) return
    createUser({ ...form, name: form.name.trim(), email: form.email.trim(), branch_id: form.branch_id || undefined }, {
      onSuccess: () => {
        setForm({ name: '', email: '', password: '', role: 'cashier', branch_id: '' })
        setTouched(false)
        onClose()
      },
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('addUser')}</h2>
          <button type="button" aria-label={t('close')} onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0C447C]"
            />
            {touched && errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0C447C]"
            />
            {touched && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0C447C]"
            />
            {touched && errors.password ? (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{t('passwordHint')}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('role')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0C447C]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{t.has(`roles.${r}`) ? t(`roles.${r}`) : r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('branch')}</label>
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0C447C]"
            >
              <option value="">{t('centralNoBranch')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
          >
            {isPending ? t('creating') : t('create')}
          </button>
        </div>
      </div>
    </div>
  )
}
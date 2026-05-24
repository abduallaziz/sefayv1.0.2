'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { DataTable, Column } from '@/shared/ui/data-table'
import { EmptyState } from '@/shared/ui/empty-state'
import { Modal } from '@/shared/ui/modal'
import { mockTemplates, ExpenseTemplate } from '../api/expenses.api'
import { LayoutTemplate, Plus, Check, X } from 'lucide-react'

export function ExpenseTemplatesList() {
  const t = useTranslations('expenses')
  const tc = useTranslations('common')

  const [templates, setTemplates] = useState(mockTemplates)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    default_amount: '',
    requires_photo: false,
    expiry_hours: '24',
  })

  function handleCreate() {
    if (!form.name || !form.expiry_hours) return
    const newTemplate: ExpenseTemplate = {
      id: Date.now().toString(),
      name: form.name,
      default_amount: form.default_amount ? Number(form.default_amount) : null,
      requires_photo: form.requires_photo,
      expiry_hours: Number(form.expiry_hours),
      is_active: true,
    }
    setTemplates(prev => [...prev, newTemplate])
    setShowModal(false)
    setForm({ name: '', default_amount: '', requires_photo: false, expiry_hours: '24' })
  }

  function handleToggle(id: string) {
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, is_active: !t.is_active } : t
    ))
  }

  const columns: Column<ExpenseTemplate>[] = [
    {
      key: 'name',
      header: t('template.name'),
      render: (row) => (
        <span className="font-medium text-slate-800">{row.name}</span>
      ),
    },
    {
      key: 'default_amount',
      header: t('template.defaultAmount'),
      render: (row) => (
        <span className="text-slate-600">
          {row.default_amount ? `${row.default_amount} ر.س` : `— ${t('common.optional') ?? ''}`}
        </span>
      ),
    },
    {
      key: 'requires_photo',
      header: t('template.requiresPhoto'),
      align: 'center',
      render: (row) => (
        row.requires_photo
          ? <Check className="w-4 h-4 text-green-500 mx-auto" />
          : <X className="w-4 h-4 text-slate-300 mx-auto" />
      ),
    },
    {
      key: 'expiry_hours',
      header: t('template.expiryHours'),
      render: (row) => (
        <span className="text-slate-600">{row.expiry_hours} {t('hours')}</span>
      ),
    },
    {
      key: 'is_active',
      header: '',
      align: 'center',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
          row.is_active
            ? 'bg-green-500/10 text-green-600 border-green-500/20'
            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {row.is_active ? tc('active') : tc('inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: tc('actions'),
      align: 'right',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(row.id) }}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
            row.is_active
              ? 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20'
              : 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20'
          }`}
        >
          {row.is_active ? tc('inactive') : tc('active')}
        </button>
      ),
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('actions.newTemplate')}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        keyExtractor={(row) => row.id}
        theme="dashboard"
        emptyState={
        <EmptyState
            title={t('empty.templates')}
            icon={LayoutTemplate}
        />
        }
      />

      {/* Create Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('template.title')}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('template.name')}
            </label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('template.defaultAmount')}
              <span className="text-slate-400 text-xs ms-1">({tc('optional')})</span>
            </label>
            <input
              type="number"
              value={form.default_amount}
              onChange={e => setForm(p => ({ ...p, default_amount: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('template.expiryHours')}
            </label>
            <input
              type="number"
              value={form.expiry_hours}
              onChange={e => setForm(p => ({ ...p, expiry_hours: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="requires_photo"
              type="checkbox"
              checked={form.requires_photo}
              onChange={e => setForm(p => ({ ...p, requires_photo: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300"
            />
            <label htmlFor="requires_photo" className="text-sm text-slate-700">
              {t('template.requiresPhoto')}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {tc('cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.name || !form.expiry_hours}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tc('create')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
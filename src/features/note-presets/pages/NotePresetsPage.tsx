'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StickyNote, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { EmptyState } from '@/shared/ui/empty-state'
import {
  useNotePresets, useCreateNotePreset, useUpdateNotePreset, useDeleteNotePreset, useReorderNotePresets,
} from '../hooks/useNotePresets'
import type { NotePreset } from '../api/note-presets.api'

export function NotePresetsPage() {
  const t = useTranslations('notePresets')
  const { data: presets = [], isLoading } = useNotePresets()
  const { mutate: createPreset, isPending: creating } = useCreateNotePreset()
  const { mutate: updatePreset } = useUpdateNotePreset()
  const { mutate: deletePreset } = useDeleteNotePreset()
  const { mutate: reorderPresets } = useReorderNotePresets()

  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NotePreset | null>(null)

  const handleAdd = () => {
    const text = newText.trim()
    if (!text) return
    createPreset({ text }, { onSuccess: () => setNewText('') })
  }

  const startEdit = (p: NotePreset) => { setEditingId(p.id); setEditingText(p.text) }
  const saveEdit = () => {
    const text = editingText.trim()
    if (editingId && text) updatePreset({ id: editingId, data: { text } })
    setEditingId(null)
  }

  const toggleActive = (p: NotePreset) => updatePreset({ id: p.id, data: { is_active: !p.is_active } })

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= presets.length) return
    const ids = presets.map((p) => p.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderPresets(ids)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deletePreset(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2 rounded-2xl border border-posCloud-border bg-posCloud-surface p-3 dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('addPlaceholder')}
          className="flex-1 min-w-0 rounded-xl border border-posCloud-border bg-posCloud-background px-3.5 py-2.5 text-sm text-posCloud-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || creating}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-posCloud-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t('add')}
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-posCloud-background dark:bg-posCloudDark-background" />
      ) : presets.length === 0 ? (
        <EmptyState icon={StickyNote} title={t('empty')} description={t('emptyHint')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-posCloud-border dark:border-posCloudDark-border">
          {presets.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 bg-posCloud-surface p-3 dark:bg-posCloudDark-surface ${i > 0 ? 'border-t border-posCloud-border dark:border-posCloudDark-border' : ''} ${!p.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex shrink-0 flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-posCloud-text-tertiary disabled:opacity-30 hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === presets.length - 1} className="text-posCloud-text-tertiary disabled:opacity-30 hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {editingId === p.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-1 min-w-0 rounded-lg border border-posCloud-primary/40 bg-posCloud-background px-2.5 py-1.5 text-sm text-posCloud-text-primary outline-none dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
                  />
                  <button onClick={saveEdit} className="text-posCloud-success"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingId(null)} className="text-posCloud-text-tertiary"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <p className="flex-1 min-w-0 truncate text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">{p.text}</p>
              )}

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggleActive(p)}
                  className={`flex items-center gap-1 text-xs font-medium ${p.is_active ? 'text-posCloud-success' : 'text-posCloud-text-tertiary'}`}
                >
                  {p.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 text-posCloud-text-tertiary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(p)} className="rounded-lg p-1.5 text-posCloud-text-tertiary hover:bg-posCloud-danger-light hover:text-posCloud-danger dark:hover:bg-posCloud-danger/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-posCloud-border bg-posCloud-surface p-5 dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
            <h3 className="mb-2 text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('deleteTitle')}</h3>
            <p className="mb-5 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('deleteConfirm', { text: deleteTarget.text })}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-posCloud-border py-2.5 text-sm font-medium text-posCloud-text-secondary dark:border-posCloudDark-border dark:text-posCloudDark-text-secondary">
                {t('cancel')}
              </button>
              <button onClick={confirmDelete} className="flex-[2] rounded-xl bg-posCloud-danger py-2.5 text-sm font-bold text-white">
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

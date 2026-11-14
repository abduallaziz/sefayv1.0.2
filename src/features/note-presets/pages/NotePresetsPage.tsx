'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StickyNote, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { EmptyState } from '@/shared/ui/empty-state'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { dupKey, toEnglishDigits } from '@/lib/digits'
import { ApiError } from '@/lib/api'
import {
  useNotePresets, useCreateNotePreset, useUpdateNotePreset, useDeleteNotePreset, useReorderNotePresets,
} from '../hooks/useNotePresets'
import type { NotePreset } from '../api/note-presets.api'

const MAX_LEN = 200

export function NotePresetsPage() {
  const t = useTranslations('notePresets')
  const { data: presets = [], isLoading } = useNotePresets()
  const { mutate: createPreset, isPending: creating } = useCreateNotePreset()
  const { mutate: updatePreset, isPending: updating } = useUpdateNotePreset()
  const { mutate: deletePreset, isPending: deleting } = useDeleteNotePreset()
  const { mutate: reorderPresets } = useReorderNotePresets()

  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NotePreset | null>(null)

  const [addError, setAddError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const isDuplicate = (text: string, exceptId?: string) =>
    presets.some((p) => p.id !== exceptId && dupKey(p.text) === dupKey(text))
  const clean = (v: string) => toEnglishDigits(v).replace(/\s+/g, ' ').trim()
  const addDuplicate = newText.trim() !== '' && isDuplicate(newText)

  const handleAdd = () => {
    const text = clean(newText)
    if (!text || creating || isDuplicate(text)) return
    setAddError(null)
    createPreset(
      { text },
      {
        onSuccess: () => setNewText(''),
        onError: (e: unknown) => setAddError(e instanceof ApiError ? e.message : t('error')),
      },
    )
  }

  const startEdit = (p: NotePreset) => { setEditingId(p.id); setEditingText(p.text); setEditError(null) }
  const cancelEdit = () => { setEditingId(null); setEditError(null) }
  const saveEdit = () => {
    const text = clean(editingText)
    if (!editingId || updating) return
    if (!text) { setEditError(t('emptyText')); return }
    if (isDuplicate(text, editingId)) { setEditError(t('duplicate')); return }
    setEditError(null)
    updatePreset(
      { id: editingId, data: { text } },
      {
        onSuccess: () => setEditingId(null),
        onError: (e: unknown) => setEditError(e instanceof ApiError ? e.message : t('error')),
      },
    )
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
    if (deleting) return
    deletePreset(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
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
          onChange={(e) => { setNewText(toEnglishDigits(e.target.value)); setAddError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          maxLength={MAX_LEN}
          aria-label={t('addPlaceholder')}
          aria-invalid={addDuplicate}
          placeholder={t('addPlaceholder')}
          className="flex-1 min-w-0 rounded-xl border border-posCloud-border bg-posCloud-background px-3.5 py-2.5 text-sm text-posCloud-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || creating || addDuplicate}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-posCloud-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t('add')}
        </button>
      </div>
      {(addDuplicate || addError) && (
        <p className="-mt-3 text-xs text-posCloud-danger">{addDuplicate ? t('duplicate') : addError}</p>
      )}

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
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('moveUp')} title={t('moveUp')} className="text-posCloud-text-tertiary disabled:opacity-30 hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === presets.length - 1} aria-label={t('moveDown')} title={t('moveDown')} className="text-posCloud-text-tertiary disabled:opacity-30 hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {editingId === p.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(e) => { setEditingText(toEnglishDigits(e.target.value)); setEditError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') cancelEdit() }}
                    maxLength={MAX_LEN}
                    aria-label={t('edit')}
                    className="flex-1 min-w-0 rounded-lg border border-posCloud-primary/40 bg-posCloud-background px-2.5 py-1.5 text-sm text-posCloud-text-primary outline-none dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
                  />
                  <button onClick={saveEdit} disabled={updating} aria-label={t('saveEdit')} title={t('saveEdit')} className="text-posCloud-success disabled:opacity-50"><Check className="h-4 w-4" /></button>
                  <button onClick={cancelEdit} aria-label={t('cancelEdit')} title={t('cancelEdit')} className="text-posCloud-text-tertiary"><X className="h-4 w-4" /></button>
                  {editError && <p className="w-full text-xs text-posCloud-danger">{editError}</p>}
                </div>
              ) : (
                <p className="flex-1 min-w-0 truncate text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">{p.text}</p>
              )}

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggleActive(p)}
                  aria-label={p.is_active ? t('deactivate') : t('activate')}
                  aria-pressed={p.is_active}
                  title={p.is_active ? t('deactivate') : t('activate')}
                  className={`flex items-center gap-1 text-xs font-medium ${p.is_active ? 'text-posCloud-success' : 'text-posCloud-text-tertiary'}`}
                >
                  {p.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => startEdit(p)} aria-label={t('edit')} title={t('edit')} className="rounded-lg p-1.5 text-posCloud-text-tertiary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(p)} aria-label={t('delete')} title={t('delete')} className="rounded-lg p-1.5 text-posCloud-text-tertiary hover:bg-posCloud-danger-light hover:text-posCloud-danger dark:hover:bg-posCloud-danger/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title={t('deleteTitle')}
        message={t('deleteConfirm', { text: deleteTarget?.text ?? '' })}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}

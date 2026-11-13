'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Check, CircleAlert, FileDown, ShieldCheck, Loader2, Minus, Plus, Redo2, Save, Send, Undo2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { SaveStatus } from '../hooks/useTemplateDraft'
import type { TemplateStatus } from '../types'

interface Props {
  name: string
  templateStatus: TemplateStatus
  saveStatus: SaveStatus
  zoom: number
  lang: 'ar' | 'en'
  canUndo: boolean
  canRedo: boolean
  busy: boolean
  onZoom: (z: number) => void
  onLang: (l: 'ar' | 'en') => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onPublish: () => void
  onPdf: () => void
  onApproval: () => void
}

const TONE = { draft: 'warning', published: 'success', archived: 'neutral' } as const

export function EditorToolbar(p: Props) {
  const t = useTranslations('documents')
  const ta = useTranslations('documents.approval')
  const status =
    p.saveStatus === 'saving' ? (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {t('saving')}
      </span>
    ) : p.saveStatus === 'saved' ? (
      <span className="flex items-center gap-1 text-xs text-posCloud-success">
        <Check className="h-3.5 w-3.5" aria-hidden />
        {t('saved')}
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs text-posCloud-warning">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden />
        {t('unsaved')}
      </span>
    )

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
      <Button asChild variant="ghost" size="icon" aria-label={t('back')}>
        <Link href="/dashboard/settings/documents">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </Button>
      <h1 className="max-w-[40vw] truncate text-sm font-semibold text-slate-800 dark:text-white">{p.name}</h1>
      <StatusBadge label={t(`status.${p.templateStatus}`)} tone={TONE[p.templateStatus]} />
      <div className="mx-2">{status}</div>

      <div className="ms-auto flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={p.onUndo} disabled={!p.canUndo} aria-label="Undo (Ctrl+Z)" title="Ctrl+Z">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={p.onRedo} disabled={!p.canRedo} aria-label="Redo (Ctrl+Y)" title="Ctrl+Y">
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-800">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => p.onZoom(Math.max(0.3, +(p.zoom - 0.1).toFixed(2)))} aria-label="-">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums">{Math.round(p.zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => p.onZoom(Math.min(2, +(p.zoom + 0.1).toFixed(2)))} aria-label="+">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold dark:border-gray-800" role="group">
          {(['ar', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => p.onLang(l)}
              className={`h-9 px-3 ${p.lang === l ? 'bg-[#0C447C] text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <Button variant="outline" onClick={p.onApproval}>
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">{ta('button')}</span>
        </Button>
        <Button variant="outline" onClick={p.onPdf} disabled={p.busy}>
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">{t('downloadPdf')}</span>
        </Button>
        <Button variant="outline" onClick={p.onSave} disabled={p.busy || p.saveStatus === 'saved'}>
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{t('save')}</span>
        </Button>
        <Button onClick={p.onPublish} disabled={p.busy || p.templateStatus === 'archived'}>
          <Send className="h-4 w-4" />
          {t('publish')}
        </Button>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowLeft,
  Check,
  CircleAlert,
  Copy,
  Eye,
  Loader2,
  Lock,
  LockOpen,
  Printer,
  Redo2,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { SaveStatus } from '../../hooks/useTemplateDraft'
import type { TemplateStatus } from '../../types'

export type AlignKind = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

interface Props {
  name: string
  docTypeLabel: string
  templateStatus: TemplateStatus
  saveStatus: SaveStatus
  lang: 'ar' | 'en'
  canUndo: boolean
  canRedo: boolean
  busy: boolean
  /** An overlay element is selected: alignment / lock apply to it. */
  overlaySelected: boolean
  anySelected: boolean
  locked: boolean
  onName: (name: string) => void
  onLang: (l: 'ar' | 'en') => void
  onUndo: () => void
  onRedo: () => void
  onAlign: (k: AlignKind) => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleLock: () => void
  onSave: () => void
  onPreview: () => void
  onPdf: () => void
  onPublish: () => void
  onApproval: () => void
}

const TONE = { draft: 'warning', published: 'success', archived: 'neutral' } as const

const ALIGNS: { k: AlignKind; icon: typeof AlignStartHorizontal; key: string }[] = [
  { k: 'right', icon: AlignEndVertical, key: 'alignRight' },
  { k: 'center', icon: AlignCenterVertical, key: 'alignCenter' },
  { k: 'left', icon: AlignStartVertical, key: 'alignLeft' },
  { k: 'top', icon: AlignStartHorizontal, key: 'alignTop' },
  { k: 'middle', icon: AlignCenterHorizontal, key: 'alignMiddle' },
  { k: 'bottom', icon: AlignEndHorizontal, key: 'alignBottom' },
]

export function QuoteTopBar(p: Props) {
  const t = useTranslations('documents')
  const te = useTranslations('documents.editor')
  const tq = useTranslations('documents.quote')
  const ta = useTranslations('documents.approval')

  const save =
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

  const iconBtn = 'h-9 w-9'
  const divider = <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-gray-700 md:block" aria-hidden />

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
      <Button asChild variant="ghost" size="icon" aria-label={t('back')}>
        <Link href="/dashboard/settings/documents">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {p.docTypeLabel}
        </span>
        <input
          value={p.name}
          maxLength={120}
          onChange={(e) => p.onName(e.target.value)}
          aria-label={t('name')}
          className="h-9 w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C]/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-56"
        />
        <StatusBadge label={t(`status.${p.templateStatus}`)} tone={TONE[p.templateStatus]} />
        {save}
      </div>

      <div className="flex flex-wrap items-center gap-0.5 md:mx-auto">
        {divider}
        {ALIGNS.map(({ k, icon: Icon, key }) => (
          <Button
            key={k}
            variant="ghost"
            size="icon"
            className={iconBtn}
            disabled={!p.overlaySelected}
            title={te(key as never)}
            aria-label={te(key as never)}
            onClick={() => p.onAlign(k)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
        {divider}
        <Button variant="ghost" size="icon" className={iconBtn} disabled={!p.anySelected} title={te('remove')} aria-label={te('remove')} onClick={p.onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className={iconBtn} disabled={!p.anySelected} title={tq('duplicate')} aria-label={tq('duplicate')} onClick={p.onDuplicate}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={iconBtn}
          disabled={!p.overlaySelected}
          title={p.locked ? te('unlock') : te('lock')}
          aria-label={p.locked ? te('unlock') : te('lock')}
          onClick={p.onToggleLock}
        >
          {p.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Button>
        {divider}
        <Button variant="ghost" size="icon" className={iconBtn} onClick={p.onUndo} disabled={!p.canUndo} aria-label="Undo (Ctrl+Z)" title="Ctrl+Z">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className={iconBtn} onClick={p.onRedo} disabled={!p.canRedo} aria-label="Redo (Ctrl+Y)" title="Ctrl+Y">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="ms-auto flex flex-wrap items-center gap-1.5">
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
          <span className="hidden xl:inline">{ta('button')}</span>
        </Button>
        <Button variant="outline" onClick={p.onPreview} disabled={p.busy}>
          <Eye className="h-4 w-4" />
          <span className="hidden xl:inline">{tq('preview')}</span>
        </Button>
        <Button variant="outline" onClick={p.onPdf} disabled={p.busy}>
          <Printer className="h-4 w-4" />
          <span className="hidden xl:inline">{tq('trialPrint')}</span>
        </Button>
        <Button variant="outline" onClick={p.onSave} disabled={p.busy || p.saveStatus === 'saved'}>
          <Save className="h-4 w-4" />
          <span className="hidden xl:inline">{t('save')}</span>
        </Button>
        <Button onClick={p.onPublish} disabled={p.busy || p.templateStatus === 'archived'}>
          <Send className="h-4 w-4" />
          {tq('publishTemplate')}
        </Button>
      </div>
    </header>
  )
}

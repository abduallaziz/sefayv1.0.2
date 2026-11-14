'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import Link from 'next/link'
import { AlertCircle, ChevronRight, Save, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { Button } from '@/shared/ui/button'
import { SectionCard } from '@/shared/ui/section-card'
import { Switch } from '@/shared/ui/switch'
import { Skeleton } from '@/shared/ui/skeleton'
import { useUpdateProfile } from '../hooks/useSettings'
import type { UpdateProfileDto } from '../api/settings.api'

/** Shared text-control look (selects/textareas/native number) matching shared Input. */
export const controlCls =
  'flex w-full rounded border border-posCloud-border bg-posCloud-background px-3 py-2 text-sm text-posCloud-text-primary transition-colors placeholder:text-posCloud-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-posCloud-danger dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary dark:placeholder:text-posCloudDark-text-tertiary'

export const choiceCls = (active: boolean) =>
  cn(
    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40',
    active
      ? 'border-posCloud-primary bg-posCloud-primary/10 text-posCloud-primary dark:text-[#5B9BD5]'
      : 'border-posCloud-border text-posCloud-text-secondary hover:border-posCloud-primary/50 dark:border-posCloudDark-border dark:text-posCloudDark-text-secondary',
  )

/** Per-section save: success toast + inline error, one mutation instance per section. */
export function useProfileSave() {
  const t = useTranslations('settings')
  const mutation = useUpdateProfile()
  const [error, setError] = useState<string | null>(null)
  function save(dto: UpdateProfileDto, onSuccess?: () => void) {
    setError(null)
    mutation.mutate(dto, {
      onSuccess: () => {
        toast.success(t('saved'), { id: 'settings-saved' })
        onSuccess?.()
      },
      onError: (e) => setError(e instanceof ApiError ? e.message : t('saveError')),
    })
  }
  return { save, saving: mutation.isPending, error, setError }
}

export function SettingsPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-posCloud-text-primary dark:text-posCloudDark-text-primary">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{description}</p>
      )}
    </header>
  )
}

export function SettingsSection({
  title,
  description,
  actions,
  children,
  footer,
  tone = 'default',
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  footer?: ReactNode
  tone?: 'default' | 'danger'
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      actions={actions}
      padding="none"
      className={cn('overflow-hidden', tone === 'danger' && 'border-red-200 dark:border-red-500/30')}
    >
      <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">{children}</div>
      {footer}
    </SectionCard>
  )
}

/** Label + description on one side, control on the other (stacked on mobile). */
export function FieldRow({
  label,
  description,
  htmlFor,
  error,
  control = 'field',
  children,
}: {
  label: string
  description?: string
  htmlFor?: string
  error?: string | null
  control?: 'field' | 'switch'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'px-5 py-4',
        control === 'switch'
          ? 'flex items-center justify-between gap-4'
          : 'grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-8',
      )}
    >
      <div className="min-w-0">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary"
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{description}</p>
        )}
      </div>
      <div className={cn('min-w-0', control === 'switch' && 'shrink-0')}>
        {children}
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-posCloud-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export function SwitchRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <FieldRow label={label} description={description} control="switch">
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </FieldRow>
  )
}

export function InlineError({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  const t = useTranslations('settings')
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border-t border-red-200 bg-red-50 px-5 py-3 dark:border-red-500/20 dark:bg-red-500/10"
    >
      <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('dismiss')}
        className="shrink-0 rounded p-1 text-red-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Section footer: dirty indicator, inline error, reset + save. */
export function SectionFooter({
  dirty,
  saving,
  onSave,
  onReset,
  error,
  onDismissError,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onReset?: () => void
  error?: string | null
  onDismissError?: () => void
}) {
  const t = useTranslations('settings')
  return (
    <>
      {error && <InlineError message={error} onDismiss={onDismissError ?? (() => {})} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-posCloudDark-border dark:bg-white/[0.02]">
        <p
          aria-live="polite"
          className={cn(
            'flex items-center gap-2 text-xs',
            dirty ? 'text-amber-600 dark:text-amber-400' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', dirty ? 'bg-amber-500' : 'bg-emerald-500')} aria-hidden />
          {dirty ? t('unsavedChanges') : t('upToDate')}
        </p>
        <div className="flex items-center gap-2">
          {onReset && dirty && !saving && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              {t('reset')}
            </Button>
          )}
          <Button type="button" size="sm" onClick={onSave} disabled={!dirty || saving}>
            <Save className="h-3.5 w-3.5" aria-hidden />
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </>
  )
}

export function SettingsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export function PageStack({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-6">{children}</div>
}

/** Row that opens another settings / design page. */
export function LinkRow({
  href, icon: Icon, title, description,
}: { href: string; icon: LucideIcon; title: string; description?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-posCloud-primary/40 dark:hover:bg-white/[0.03]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="rounded-lg bg-posCloud-primary/10 p-2 text-posCloud-primary dark:text-[#5B9BD5]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{title}</span>
          {description && <span className="mt-0.5 block text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{description}</span>}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-posCloud-text-tertiary transition-colors group-hover:text-posCloud-primary rtl:rotate-180" aria-hidden />
    </Link>
  )
}

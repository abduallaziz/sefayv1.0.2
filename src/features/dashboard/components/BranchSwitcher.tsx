'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'
import { useBranchContext } from '@/core/branch/useBranchContext'

// Wires the previously-placeholder header "Branch" button (B6 decision: kept
// visual-only, no store/backend existed yet) into the real shared Branch
// Context — Branch System Step 3. Central users get a real switcher; branch-
// restricted users see their fixed branch with no way to change it, per the
// approved model.
export function BranchSwitcher({ variant }: { variant: 'icon' | 'label' }) {
  const t = useTranslations('header')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const {
    currentBranch,
    availableBranches,
    setCurrentBranch,
    isCentral,
    currentBranchInactive,
    isLoading,
  } = useBranchContext()

  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function toggleOpen() {
    if (!isCentral) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const menuWidth = 220
      const rawLeft = isRTL ? rect.left : rect.right - menuWidth
      const clampedLeft = Math.min(Math.max(rawLeft, 8), window.innerWidth - menuWidth - 8)
      setPos({ top: rect.bottom + 8, left: clampedLeft })
    }
    setOpen((v) => !v)
  }

  const label = currentBranchInactive
    ? t('branchInactive', { name: currentBranch?.name ?? '' })
    : currentBranch?.name ?? (isLoading ? t('branchLoading') : t('branch'))

  const icon = (
    <svg width={variant === 'icon' ? 16 : 15} height={variant === 'icon' ? 16 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )

  const baseBtnClass =
    'flex shrink-0 items-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-2 text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40'

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label={t('branch')}
        title={label}
        className={
          variant === 'icon'
            ? `${baseBtnClass} lg:hidden ${!isCentral ? 'cursor-default' : ''}`
            : `hidden ${baseBtnClass} lg:flex ${!isCentral ? 'cursor-default' : ''}`
        }
      >
        {icon}
        {variant === 'label' && <span className="max-w-[140px] truncate">{label}</span>}
        {variant === 'label' && isCentral && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-55">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && isCentral && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 220 }}
          className="z-[1000] rounded-xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface p-1.5 shadow-lg"
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            {t('switchBranch')}
          </div>
          {availableBranches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              {t('noBranchesAvailable')}
            </div>
          ) : (
            availableBranches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setCurrentBranch(b.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 ${
                  b.id === currentBranch?.id
                    ? 'text-posCloud-primary dark:text-posCloud-primary-400 font-semibold'
                    : 'text-posCloud-text-secondary dark:text-posCloudDark-text-secondary'
                }`}
                style={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                {b.name}
              </button>
            ))
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}

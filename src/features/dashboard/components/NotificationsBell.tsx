'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

interface NotificationRow {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

interface NotificationsResponse {
  data: NotificationRow[]
  meta: { total: number; unreadCount: number }
}

const KEY = ['notifications', 'header']

export function NotificationsBell() {
  const t = useTranslations('header')
  const locale = useLocale()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.get<NotificationsResponse>('/notifications?limit=15&offset=0'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const readAll = useMutation({
    mutationFn: () => apiClient.patch<void>('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
  const readOne = useMutation({
    mutationFn: (id: string) => apiClient.patch<void>(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = data?.meta.unreadCount ?? 0
  const rows = data?.data ?? []

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={t('notifications')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-posCloud-text-tertiary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 max-[480px]:flex max-[480px]:h-8 max-[480px]:w-8 max-[480px]:items-center max-[480px]:justify-center max-[480px]:p-0"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 end-[-2px] flex h-4 min-w-4 items-center justify-center rounded-full bg-posCloud-danger px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t('notifications')}
          className="absolute end-0 top-full z-[1000] mt-2 w-[min(340px,calc(100vw-16px))] rounded-xl border border-posCloud-border bg-posCloud-surface p-1.5 shadow-lg dark:border-posCloudDark-border dark:bg-posCloudDark-surface"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {t('notifications')}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => readAll.mutate()}
                className="text-xs font-semibold text-posCloud-primary hover:underline"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-posCloud-text-tertiary">{t('noNotifications')}</p>
            ) : (
              rows.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.is_read && readOne.mutate(n.id)}
                  className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-start hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-posCloud-primary" />}
                    <span className="truncate">{n.title}</span>
                  </span>
                  <span className="line-clamp-2 text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{n.body}</span>
                  <span className="text-[11px] text-posCloud-text-tertiary">{formatDateTime(n.created_at, locale)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

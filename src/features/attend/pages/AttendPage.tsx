'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, MapPin, CheckCircle2, XCircle, LogIn, LogOut, RefreshCw, ShieldCheck, Clock, CalendarCheck, TrendingUp, Gift } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'

const DEVICE_ID_KEY = 'sefay_attend_device_id'

function getDeviceFingerprint(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID() + '-' + crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

type LocationState = 'locating' | 'in_range' | 'out_of_range' | 'error'

interface Status {
  name: string
  job_title: string | null
  checked_in: boolean
  today_check_in_at: string | null
  today_check_out_at: string | null
  zone_name: string | null
  tenant_name: string | null
  tenant_logo_url: string | null
}

interface Leave {
  id: string
  leave_type: string
  date_from: string
  date_to: string
  days_count: number
  status: 'pending' | 'approved' | 'rejected'
}

interface Notification {
  id: string
  title: string
  body: string | null
  created_at: string
}

interface Dashboard {
  work_hours_today: number
  work_days_this_month: number
  monthly_hours_total: number
  leave_balance: number | null
  recent_leaves: Leave[]
  recent_notifications: Notification[]
}

export function AttendPage({ token }: { token: string }) {
  const t = useTranslations('attend')
  const [status, setStatus] = useState<Status | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationState, setLocationState] = useState<LocationState>('locating')
  const [locationKey, setLocationKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ action: 'check_in' | 'check_out'; code: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState<'dashboard' | 'checkin'>('checkin')

  useEffect(() => {
    fetch(`/api/v1/attend/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true)
          return
        }
        setStatus(await res.json())
      })
      .catch(() => setNotFound(true))

    fetch(`/api/v1/attend/${token}/dashboard`)
      .then(async (res) => {
        if (res.ok) setDashboard(await res.json())
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState('error')
      return
    }
    setLocationState('locating')
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        // We don't know the geofence radius client-side — the real check happens
        // server-side on submit. Here we just confirm we have a location fix.
        setLocationState('in_range')
      },
      () => setLocationState('error'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [locationKey])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit() {
    if (!coords) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/attend/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          device_fingerprint: getDeviceFingerprint(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLocationState(res.status === 400 ? 'out_of_range' : locationState)
        setError(data.message ?? t('error'))
        return
      }
      setResult(data)
      setStatus((s) => s && {
        ...s,
        checked_in: data.action === 'check_in',
        today_check_in_at: data.action === 'check_in' ? data.time : s.today_check_in_at,
        today_check_out_at: data.action === 'check_out' ? data.time : s.today_check_out_at,
      })
      fetch(`/api/v1/attend/${token}/dashboard`)
        .then(async (r) => { if (r.ok) setDashboard(await r.json()) })
        .catch(() => {})
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <Shell>
        <p className="text-center text-red-500">{t('invalidLink')}</p>
      </Shell>
    )
  }

  const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--')
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Shell>
      <div className="space-y-4">
        {status?.tenant_name && (
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-gray-800">
            {status.tenant_logo_url ? (
              <img src={status.tenant_logo_url} alt={status.tenant_name} className="w-6 h-6 rounded-md object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-md bg-[#0C447C] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                {initials(status.tenant_name)}
              </div>
            )}
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{status.tenant_name}</p>
          </div>
        )}
        {status && (
          <div className="flex items-start justify-between">
            <Bell className="w-5 h-5 text-slate-400 mt-1.5" />
            <div className="flex items-center gap-2.5">
              <div className="text-end">
                <p className="text-base font-bold text-slate-800 dark:text-white tracking-tight">{t('greeting', { name: status.name })} 👋</p>
                {status.job_title && <p className="text-xs text-slate-400 mb-1">{status.job_title}</p>}
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  status.checked_in ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.checked_in ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {status.checked_in ? t('insideWork') : t('outsideWork')}
                </span>
              </div>
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#0C447C] flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {initials(status.name)}
                </div>
                <span className={`absolute bottom-0 end-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${status.checked_in ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            </div>
          </div>
        )}

        {result ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold text-slate-800 dark:text-white">
              {result.action === 'check_in' ? t('checkedIn') : t('checkedOut')}
            </p>
            <p className="text-sm text-slate-500">{t('confirmationCode')}</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-[#0C447C] dark:text-[#5B9BD5]">{result.code}</p>
            <button onClick={() => setResult(null)} className="text-xs text-[#0C447C] dark:text-[#5B9BD5]">
              {t('navHome')}
            </button>
          </div>
        ) : view === 'checkin' ? (
          <>
            <div className={`rounded-xl p-4 text-center space-y-1.5 ${locationState === 'in_range' ? 'bg-emerald-50 dark:bg-emerald-500/10' : locationState === 'locating' ? 'bg-slate-50 dark:bg-gray-800' : 'bg-red-50 dark:bg-red-500/10'}`}>
              <div className="flex justify-center mb-1">
                {locationState === 'locating' && (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-400 animate-pulse" />
                  </div>
                )}
                {locationState === 'in_range' && (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                )}
                {(locationState === 'out_of_range' || locationState === 'error') && (
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <p className={`text-sm font-semibold ${locationState === 'in_range' ? 'text-emerald-700 dark:text-emerald-400' : locationState === 'locating' ? 'text-slate-500' : 'text-red-600 dark:text-red-400'}`}>
                {locationState === 'locating' && t('locating')}
                {locationState === 'in_range' && t('locationCorrect')}
                {locationState === 'error' && t('locationError')}
                {locationState === 'out_of_range' && t('outOfRange')}
              </p>
              {locationState === 'in_range' && status?.zone_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{status.zone_name}</p>
              )}
              <button
                onClick={() => setLocationKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs text-[#0C447C] dark:text-[#5B9BD5] mx-auto"
              >
                <MapPin className="w-3 h-3" />
                {t('changeLocation')}
              </button>
            </div>

            <div className="text-center py-2">
              <p className="text-xs text-slate-400 mb-1">{t('currentTime')}</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums">
                {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
              <p className="text-xs text-slate-400 mt-1">{fmtDate(now)}</p>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || locationState !== 'in_range'}
              className={`w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm transition-colors ${
                status?.checked_in ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting ? t('submitting') : status?.checked_in ? t('checkOutAction') : t('checkInAction')}
              {status?.checked_in ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </button>
            <p className="flex items-center justify-center gap-1 text-xs text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('autoNote')}
            </p>

            {status && (
              <div className="pt-3 border-t border-slate-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('todaySummary')}</p>
                  <button onClick={() => setView('dashboard')} className="text-xs text-[#0C447C] dark:text-[#5B9BD5]">
                    {t('viewDetails')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{fmtTime(status.today_check_out_at)}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{t('checkOutLabel')}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{fmtTime(status.today_check_in_at)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('checkInLabel')}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : status && dashboard && (
          <div className="space-y-3">
            <button
              onClick={() => setView('checkin')}
              className={`w-full rounded-xl p-3 flex items-center justify-between ${status.checked_in ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-slate-50 dark:bg-gray-800'}`}
            >
              <span className={`w-2 h-2 rounded-full ${status.checked_in ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <p className={`text-sm font-semibold ${status.checked_in ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                {status.checked_in ? t('insideWorkNow') : t('outsideWorkNow')}
              </p>
              {status.checked_in ? <LogOut className="w-4 h-4 text-slate-400" /> : <LogIn className="w-4 h-4 text-slate-400" />}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs text-slate-400">{t('today')}</p>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{dashboard.work_hours_today.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">{t('totalWorkHoursToday')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <CalendarCheck className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{dashboard.work_days_this_month}</p>
                <p className="text-[10px] text-slate-400">{t('workDaysThisMonth')}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{dashboard.monthly_hours_total.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('monthlyHoursTotal')}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Gift className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{dashboard.leave_balance ?? '—'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('leaveBalance')}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('recentLeaves')}</p>
                <span className="text-xs text-[#0C447C] dark:text-[#5B9BD5]">{t('viewAll')}</span>
              </div>
              {dashboard.recent_leaves.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">{t('noLeaves')}</p>
              ) : (
                <div className="space-y-1.5">
                  {dashboard.recent_leaves.map((l) => (
                    <div key={l.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-lg p-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : l.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {t(l.status)}
                      </span>
                      <div className="text-end">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{t('leaveDaysCount', { count: l.days_count })}</p>
                        <p className="text-slate-400">{t('leaveDateRange', { from: l.date_from, to: l.date_to })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('recentNotifications')}</p>
              {dashboard.recent_notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">{t('noNotifications')}</p>
              ) : (
                <div className="space-y-1.5">
                  {dashboard.recent_notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{n.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <BottomNav token={token} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}

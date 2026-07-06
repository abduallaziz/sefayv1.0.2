'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, CheckCircle2, XCircle, LogIn, LogOut, RefreshCw } from 'lucide-react'

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
}

export function AttendPage({ token }: { token: string }) {
  const t = useTranslations('attend')
  const [status, setStatus] = useState<Status | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationState, setLocationState] = useState<LocationState>('locating')
  const [locationKey, setLocationKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ action: 'check_in' | 'check_out'; code: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

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
        {status && (
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#0C447C] flex items-center justify-center text-white text-xs font-semibold">
              {initials(status.name)}
            </div>
            <div className="text-end">
              <p className="text-base font-semibold text-slate-800 dark:text-white">{t('greeting', { name: status.name })}</p>
              {status.job_title && <p className="text-xs text-slate-400">{status.job_title}</p>}
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
          </div>
        ) : (
          <>
            <div className={`rounded-xl p-4 space-y-1 ${locationState === 'in_range' ? 'bg-emerald-50 dark:bg-emerald-500/10' : locationState === 'locating' ? 'bg-slate-50 dark:bg-gray-800' : 'bg-red-50 dark:bg-red-500/10'}`}>
              <div className="flex items-center gap-2">
                {locationState === 'locating' && <MapPin className="w-5 h-5 text-slate-400 animate-pulse" />}
                {locationState === 'in_range' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {(locationState === 'out_of_range' || locationState === 'error') && <XCircle className="w-5 h-5 text-red-500" />}
                <p className={`text-sm font-semibold ${locationState === 'in_range' ? 'text-emerald-700 dark:text-emerald-400' : locationState === 'locating' ? 'text-slate-500' : 'text-red-600 dark:text-red-400'}`}>
                  {locationState === 'locating' && t('locating')}
                  {locationState === 'in_range' && t('locationCorrect')}
                  {locationState === 'error' && t('locationError')}
                  {locationState === 'out_of_range' && t('outOfRange')}
                </p>
              </div>
              {locationState === 'in_range' && status?.zone_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400 ps-7">{status.zone_name}</p>
              )}
              <button
                onClick={() => setLocationKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs text-[#0C447C] dark:text-[#5B9BD5] ps-7"
              >
                <RefreshCw className="w-3 h-3" />
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
              className={`w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 text-white rounded-xl font-semibold ${
                status?.checked_in ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {status?.checked_in ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {submitting ? t('submitting') : status?.checked_in ? t('checkOutAction') : t('checkInAction')}
            </button>
            <p className="text-xs text-slate-400 text-center">{t('autoNote')}</p>
          </>
        )}

        {status && (
          <div className="pt-2 border-t border-slate-100 dark:border-gray-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('todaySummary')}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{fmtTime(status.today_check_out_at)}</p>
                <p className="text-xs text-red-600 dark:text-red-400">{t('checkOutLabel')}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{fmtTime(status.today_check_in_at)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('checkInLabel')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}

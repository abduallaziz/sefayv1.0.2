'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react'

const DEVICE_ID_KEY = 'sefay_attend_device_id'

function getDeviceFingerprint(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID() + '-' + crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

type LocationState = 'locating' | 'in_range' | 'out_of_range' | 'error'

export function AttendPage({ token }: { token: string }) {
  const t = useTranslations('attend')
  const [name, setName] = useState<string | null>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationState, setLocationState] = useState<LocationState>('locating')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ action: 'check_in' | 'check_out'; code: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/v1/attend/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setName(data.name)
        setCheckedIn(data.checked_in)
      })
      .catch(() => setNotFound(true))
  }, [token])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState('error')
      return
    }
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
      setCheckedIn(data.action === 'check_in')
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

  if (result) {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-lg font-semibold text-slate-800 dark:text-white">
            {result.action === 'check_in' ? t('checkedIn') : t('checkedOut')}
          </p>
          <p className="text-sm text-slate-500">{t('confirmationCode')}</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-[#0C447C] dark:text-[#5B9BD5]">{result.code}</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="text-center space-y-4">
        {name && <p className="text-lg font-semibold text-slate-800 dark:text-white">{t('greeting', { name })}</p>}

        <div className="flex flex-col items-center gap-2 py-4">
          {locationState === 'locating' && (
            <>
              <MapPin className="w-8 h-8 text-slate-400 animate-pulse" />
              <p className="text-sm text-slate-500">{t('locating')}</p>
            </>
          )}
          {locationState === 'in_range' && (
            <>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('locationReady')}</p>
            </>
          )}
          {(locationState === 'out_of_range' || locationState === 'error') && (
            <>
              <XCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {locationState === 'error' ? t('locationError') : t('outOfRange')}
              </p>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || locationState !== 'in_range'}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl font-medium"
        >
          {checkedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {submitting ? t('submitting') : checkedIn ? t('checkOutAction') : t('checkInAction')}
        </button>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}

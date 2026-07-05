'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { X, Copy, Check, Link as LinkIcon, MapPin, Trash2, RotateCcw } from 'lucide-react'
import { useUpdateUser, useGenerateAttendanceLink, useUnbindAttendanceDevice } from '../hooks/useUsers'
import { useEmployeeGeofences, useCreateEmployeeGeofence, useDeleteEmployeeGeofence } from '@/features/hr/hooks/useHr'
import { DateRangePicker } from '@/shared/ui/date-range-picker'
import type { User, LateDeductionMode } from '../api/users.api'

// Leaflet touches `window` at module load time, which breaks SSR — must be
// loaded client-only.
const LocationMapPicker = dynamic(
  () => import('@/shared/ui/location-map-picker').then((m) => m.LocationMapPicker),
  { ssr: false },
)

export function EmployeeSettingsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const t = useTranslations('users.settings')
  const { mutate: updateUser, isPending: savingPayroll } = useUpdateUser()
  const { mutate: generateLink, isPending: generatingLink } = useGenerateAttendanceLink()
  const { mutate: unbindDevice, isPending: unbinding } = useUnbindAttendanceDevice()
  const { data: zones = [] } = useEmployeeGeofences(user.id)
  const { mutate: createZone, isPending: creatingZone } = useCreateEmployeeGeofence()
  const { mutate: deleteZone } = useDeleteEmployeeGeofence()

  const [department, setDepartment] = useState(user.department ?? '')
  const [baseSalary, setBaseSalary] = useState(user.base_salary?.toString() ?? '')
  const [gracePeriod, setGracePeriod] = useState(String(user.grace_period_minutes ?? 0))
  const [deductionMode, setDeductionMode] = useState<LateDeductionMode | ''>(user.late_deduction_mode ?? '')
  const [deductionValue, setDeductionValue] = useState(user.late_deduction_value?.toString() ?? '')
  const [copied, setCopied] = useState(false)

  const [zoneName, setZoneName] = useState('')
  const [zoneLat, setZoneLat] = useState('')
  const [zoneLng, setZoneLng] = useState('')
  const [zoneRadius, setZoneRadius] = useState('150')
  const [zoneFrom, setZoneFrom] = useState('')
  const [zoneTo, setZoneTo] = useState('')
  const [locating, setLocating] = useState(false)

  const link = user.attendance_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/attend/${user.attendance_token}`
    : null

  function savePayroll() {
    updateUser({
      id: user.id,
      data: {
        department: department.trim() === '' ? null : department.trim(),
        base_salary: baseSalary === '' ? null : Number(baseSalary),
        grace_period_minutes: Number(gracePeriod) || 0,
        late_deduction_mode: deductionMode === '' ? null : deductionMode,
        late_deduction_value: deductionValue === '' ? null : Number(deductionValue),
      },
    })
  }

  function copyLink() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function useMyLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setZoneLat(pos.coords.latitude.toFixed(6))
        setZoneLng(pos.coords.longitude.toFixed(6))
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function addZone() {
    if (!zoneLat || !zoneLng || !zoneRadius) return
    createZone(
      {
        user_id: user.id,
        name: zoneName || undefined,
        center_lat: Number(zoneLat),
        center_lng: Number(zoneLng),
        radius_m: Number(zoneRadius),
        valid_from: zoneFrom || undefined,
        valid_to: zoneTo || undefined,
      },
      {
        onSuccess: () => {
          setZoneName('')
          setZoneLat('')
          setZoneLng('')
          setZoneRadius('150')
          setZoneFrom('')
          setZoneTo('')
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('title', { name: user.name })}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payroll policy */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">{t('department')}</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={t('departmentPlaceholder')}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('baseSalary')}</label>
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('gracePeriod')}</label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('deductionMode')}</label>
              <select
                value={deductionMode}
                onChange={(e) => setDeductionMode(e.target.value as LateDeductionMode | '')}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              >
                <option value="">{t('deductionModeNone')}</option>
                <option value="fixed">{t('deductionModeFixed')}</option>
                <option value="per_minute">{t('deductionModePerMinute')}</option>
                <option value="percentage_of_daily_rate">{t('deductionModePercentage')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('deductionValue')}</label>
              <input
                type="number"
                step="0.01"
                value={deductionValue}
                onChange={(e) => setDeductionValue(e.target.value)}
                disabled={!deductionMode}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
          <button
            onClick={savePayroll}
            disabled={savingPayroll}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {savingPayroll ? t('saving') : t('save')}
          </button>
        </div>

        {/* Attendance link */}
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-gray-800">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> {t('attendanceLink')}
          </h3>
          {link ? (
            <>
              <div className="flex items-center gap-2">
                <input readOnly value={link} className="flex-1 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-400" />
                <button onClick={copyLink} className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-[#0C447C]">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => unbindDevice(user.id)}
                  disabled={unbinding}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t('unbindDevice')}
                </button>
                <button
                  onClick={() => generateLink(user.id)}
                  disabled={generatingLink}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> {t('regenerateLink')}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => generateLink(user.id)}
              disabled={generatingLink}
              className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {generatingLink ? t('generating') : t('generateLink')}
            </button>
          )}
        </div>

        {/* Geofence zones */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-gray-800">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {t('geofenceZones')}
          </h3>
          <p className="text-xs text-slate-400">{t('geofenceHint')}</p>

          {zones.length > 0 && (
            <div className="space-y-1.5">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-950 rounded-lg px-3 py-2 text-xs">
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{z.name || t('unnamedZone')}</span>
                    <span className="text-slate-400"> · {z.radius_m}m</span>
                    {(z.valid_from || z.valid_to) && (
                      <span className="text-slate-400"> · {z.valid_from ?? '…'} → {z.valid_to ?? '…'}</span>
                    )}
                  </div>
                  <button onClick={() => deleteZone(z.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder={t('zoneName')}
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="col-span-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            />
            <input
              placeholder={t('lat')}
              value={zoneLat}
              onChange={(e) => setZoneLat(e.target.value)}
              className="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            />
            <input
              placeholder={t('lng')}
              value={zoneLng}
              onChange={(e) => setZoneLng(e.target.value)}
              className="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            />
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="col-span-2 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-[#0C447C] dark:text-[#5B9BD5] hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              {locating ? t('locating') : t('useMyLocation')}
            </button>
            <input
              type="number"
              placeholder={t('radiusM')}
              value={zoneRadius}
              onChange={(e) => setZoneRadius(e.target.value)}
              className="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            />
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1">{t('pickOnMap')}</p>
              <LocationMapPicker
                lat={zoneLat ? Number(zoneLat) : null}
                lng={zoneLng ? Number(zoneLng) : null}
                radiusM={zoneRadius ? Number(zoneRadius) : null}
                onPick={(lat, lng) => {
                  setZoneLat(lat.toFixed(6))
                  setZoneLng(lng.toFixed(6))
                }}
              />
            </div>
            <div className="col-span-2">
              <DateRangePicker
                value={{ from: zoneFrom || undefined, to: zoneTo || undefined }}
                onChange={(range) => {
                  setZoneFrom(range.from ?? '')
                  setZoneTo(range.to ?? '')
                }}
              />
            </div>
          </div>
          <button
            onClick={addZone}
            disabled={creatingZone || !zoneLat || !zoneLng}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {creatingZone ? t('saving') : t('addZone')}
          </button>
        </div>
      </div>
    </div>
  )
}

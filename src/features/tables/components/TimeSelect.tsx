'use client'

import { SimpleSelect } from './SimpleSelect'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

interface Props {
  /** "HH:mm" (24h, English digits). */
  value: string
  onChange: (value: string) => void
  hourLabel: string
  minuteLabel: string
}

/** Hour + minute pickers built on the project Select (no native <input type="time">). */
export function TimeSelect({ value, onChange, hourLabel, minuteLabel }: Props) {
  const [h = '19', m = '00'] = value.split(':')
  const minute = MINUTES.includes(m) ? m : String(Math.floor(Number(m) / 5) * 5).padStart(2, '0')
  return (
    <div className="flex items-center gap-2" dir="ltr">
      <SimpleSelect
        value={h}
        onChange={(v) => onChange(`${v}:${minute}`)}
        options={HOURS.map((x) => ({ value: x, label: x }))}
        ariaLabel={hourLabel}
      />
      <span className="text-gray-500">:</span>
      <SimpleSelect
        value={minute}
        onChange={(v) => onChange(`${h}:${v}`)}
        options={MINUTES.map((x) => ({ value: x, label: x }))}
        ariaLabel={minuteLabel}
      />
    </div>
  )
}

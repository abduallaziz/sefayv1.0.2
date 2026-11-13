'use client'

import { useTranslations } from 'next-intl'
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowUp,
  Lock,
  LockOpen,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { TemplateElement } from '../types'

const label = 'text-xs font-medium text-slate-600 dark:text-gray-400'

function NumField({
  l,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  l: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (n: number) => void
}) {
  return (
    <div className="space-y-1">
      <label className={label}>{l}</label>
      <Input
        className="h-9"
        type="number"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)))
        }}
      />
    </div>
  )
}

interface Props {
  element: TemplateElement
  onElement: (patch: Partial<TemplateElement>) => void
  pageSizeMm: { w: number; h: number }
}

/** Geometry / appearance controls for a free overlay element (stamp, signature, logo, image). */
export function OverlaySection({ element, onElement, pageSizeMm }: Props) {
  const te = useTranslations('documents.editor')
  const pos = element.position as { x: number; y: number }
  const size = element.size as { width: number; height: number }
  const ratio = size.width / size.height
  const keep = element.maintainAspect !== false
  const locked = element.locked === true
  const setPos = (patch: Partial<{ x: number; y: number }>) => onElement({ position: { ...pos, ...patch } })
  const align = 'h-8 w-8'
  const isQr = element.type === 'qr' || element.type === 'signature_qr'
  const fix = (n: number) => +n.toFixed(1)

  return (
    <section className="space-y-3">
      <h4 className={label}>{te('geometry')}</h4>
      <div className="grid grid-cols-2 gap-2">
        <NumField l={te('x')} value={pos.x} min={-500} max={1500} onChange={(x) => setPos({ x })} />
        <NumField l={te('y')} value={pos.y} min={-500} max={3000} onChange={(y) => setPos({ y })} />
        <NumField
          l={te('width')}
          value={size.width}
          min={1}
          max={1000}
          onChange={(width) => onElement({ size: { width, height: keep ? Math.max(1, fix(width / ratio)) : size.height } })}
        />
        <NumField
          l={te('height')}
          value={size.height}
          min={1}
          max={1000}
          onChange={(height) => onElement({ size: { height, width: keep ? Math.max(1, fix(height * ratio)) : size.width } })}
        />
        <NumField l={te('rotation')} value={element.rotation ?? 0} min={-360} max={360} step={1} onChange={(rotation) => onElement({ rotation })} />
        <NumField
          l={te('layer')}
          value={element.zIndex ?? 1}
          min={0}
          max={1000}
          step={1}
          onChange={(zIndex) => onElement({ zIndex: Math.round(zIndex) })}
        />
      </div>

      <div className="space-y-1">
        <label className={label}>
          {te('opacity')}: <span className="tabular-nums">{Math.round((element.opacity ?? 1) * 100)}%</span>
        </label>
        <input
          type="range"
          min={isQr ? 85 : 0}
          max={100}
          value={Math.round((element.opacity ?? 1) * 100)}
          onChange={(e) => onElement({ opacity: Number(e.target.value) / 100 })}
          className="w-full accent-[#0C447C]"
        />
      </div>

      <div className="space-y-1">
        <span className={label}>{te('alignPage')}</span>
        <div className="flex flex-wrap gap-1">
          <Button size="icon" variant="outline" className={align} title={te('alignLeft')} aria-label={te('alignLeft')} onClick={() => setPos({ x: 0 })}>
            <AlignHorizontalJustifyStart className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className={align}
            title={te('alignCenter')}
            aria-label={te('alignCenter')}
            onClick={() => setPos({ x: fix((pageSizeMm.w - size.width) / 2) })}
          >
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className={align}
            title={te('alignRight')}
            aria-label={te('alignRight')}
            onClick={() => setPos({ x: fix(pageSizeMm.w - size.width) })}
          >
            <AlignHorizontalJustifyEnd className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className={align} title={te('alignTop')} aria-label={te('alignTop')} onClick={() => setPos({ y: 0 })}>
            <AlignVerticalJustifyStart className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className={align}
            title={te('alignMiddle')}
            aria-label={te('alignMiddle')}
            onClick={() => setPos({ y: fix((pageSizeMm.h - size.height) / 2) })}
          >
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className={align}
            title={te('alignBottom')}
            aria-label={te('alignBottom')}
            onClick={() => setPos({ y: fix(pageSizeMm.h - size.height) })}
          >
            <AlignVerticalJustifyEnd className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onElement({ zIndex: Math.min(1000, (element.zIndex ?? 1) + 1) })}>
          <ArrowUp className="h-4 w-4" />
          {te('bringForward')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onElement({ zIndex: Math.max(0, (element.zIndex ?? 1) - 1) })}>
          <ArrowDown className="h-4 w-4" />
          {te('sendBack')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onElement({ locked: !locked })}>
          {locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {locked ? te('unlock') : te('lock')}
        </Button>
      </div>

      <div className="space-y-1">
        <label className={label}>{te('anchor.title')}</label>
        <select
          className="h-9 w-full rounded border border-posCloud-border bg-posCloud-background px-3 text-sm dark:border-posCloudDark-border dark:bg-posCloudDark-background"
          value={element.anchor ?? 'first'}
          onChange={(e) => onElement({ anchor: e.target.value as 'first' | 'every' })}
        >
          <option value="first">{te('anchor.first')}</option>
          <option value="every">{te('anchor.every')}</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={keep}
          onChange={(e) => onElement({ maintainAspect: e.target.checked })}
          className="h-4 w-4 accent-[#0C447C]"
        />
        {te('keepAspect')}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={element.visible !== false}
          onChange={(e) => onElement({ visible: e.target.checked })}
          className="h-4 w-4 accent-[#0C447C]"
        />
        {te('visible')}
      </label>
    </section>
  )
}

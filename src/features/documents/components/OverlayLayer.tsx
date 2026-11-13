'use client'

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { MM_TO_PX } from '../lib/elements'
import type { CSSProperties } from 'react'
import type { TemplateElement } from '../types'

type Mode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'rotate'

interface Props {
  elements: TemplateElement[]
  urls: Record<string, string>
  zoom: number
  pageWidthMm: number
  pageHeightMm: number
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<TemplateElement>) => void
  /** Called once when a drag/resize/rotate starts, so the whole gesture is ONE undo step. */
  onGestureStart: () => void
}

/** Live look of a text box (same options the renderer turns into CSS). */
function textBoxCss(e: TemplateElement): CSSProperties {
  const s = e.style ?? {}
  return {
    color: s.color,
    background: s.bg,
    border: s.border ? `${(s.borderWidth ?? 0.3) * MM_TO_PX}px solid ${s.border}` : undefined,
    borderRadius: s.radius !== undefined ? s.radius * MM_TO_PX : undefined,
    padding: s.padding !== undefined ? s.padding * MM_TO_PX : undefined,
    fontSize: s.fontSize !== undefined ? (s.fontSize * 96) / 72 : 14,
    textAlign: s.align === 'start' ? 'start' : s.align === 'end' ? 'end' : s.align === 'center' ? 'center' : undefined,
    fontWeight: s.weight === 'bold' ? 700 : undefined,
  }
}

const SNAP_MM = 1.5
const MIN_MM = 3
const r1 = (n: number) => Math.round(n * 10) / 10

const HANDLES: { mode: Mode; cls: string; cursor: string }[] = [
  { mode: 'nw', cls: '-left-1.5 -top-1.5', cursor: 'nwse-resize' },
  { mode: 'n', cls: 'left-1/2 -top-1.5 -translate-x-1/2', cursor: 'ns-resize' },
  { mode: 'ne', cls: '-right-1.5 -top-1.5', cursor: 'nesw-resize' },
  { mode: 'e', cls: '-right-1.5 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
  { mode: 'se', cls: '-right-1.5 -bottom-1.5', cursor: 'nwse-resize' },
  { mode: 's', cls: 'left-1/2 -bottom-1.5 -translate-x-1/2', cursor: 'ns-resize' },
  { mode: 'sw', cls: '-left-1.5 -bottom-1.5', cursor: 'nesw-resize' },
  { mode: 'w', cls: '-left-1.5 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
]

/** Live overlay elements (stamps, signatures, logos, images, QR) in page millimetres. */
export function OverlayLayer({
  elements,
  urls,
  zoom,
  pageWidthMm,
  pageHeightMm,
  selectedId,
  onSelect,
  onChange,
  onGestureStart,
}: Props) {
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] })
  const nodes = useRef<Record<string, HTMLDivElement | null>>({})

  const begin = (e: ReactPointerEvent, el: TemplateElement, mode: Mode) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect(el.id)
    if (el.locked || !el.position || !el.size) return
    onGestureStart()
    const s = {
      x: e.clientX,
      y: e.clientY,
      px: el.position.x,
      py: el.position.y,
      w: el.size.width,
      h: el.size.height,
    }
    const ratio = s.w / s.h
    const keepAspect = el.maintainAspect !== false
    const k = zoom * MM_TO_PX

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - s.x) / k
      const dy = (ev.clientY - s.y) / k

      if (mode === 'rotate') {
        const node = nodes.current[el.id]
        if (!node) return
        const b = node.getBoundingClientRect()
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        let deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
        if (deg > 180) deg -= 360
        if (ev.shiftKey) deg = Math.round(deg / 15) * 15
        onChange(el.id, { rotation: Math.round(deg) })
        return
      }

      let x = s.px
      let y = s.py
      let w = s.w
      let h = s.h

      if (mode === 'move') {
        x = s.px + dx
        y = s.py + dy
        const vs: number[] = []
        const hs: number[] = []
        // snap edges / centre to the page edges and centre
        const xTargets = [
          { at: 0, v: 0 },
          { at: (pageWidthMm - w) / 2, v: pageWidthMm / 2 },
          { at: pageWidthMm - w, v: pageWidthMm },
        ]
        const yTargets = [
          { at: 0, v: 0 },
          { at: (pageHeightMm - h) / 2, v: pageHeightMm / 2 },
          { at: pageHeightMm - h, v: pageHeightMm },
        ]
        for (const t of xTargets) if (Math.abs(x - t.at) < SNAP_MM) (x = t.at), vs.push(t.v)
        for (const t of yTargets) if (Math.abs(y - t.at) < SNAP_MM) (y = t.at), hs.push(t.v)
        setGuides({ v: vs, h: hs })
      } else {
        const corner = mode.length === 2
        if (corner && keepAspect) {
          if (mode === 'se' || mode === 'ne') w = s.w + dx
          else w = s.w - dx
          w = Math.max(MIN_MM, w)
          h = w / ratio
          if (mode === 'nw' || mode === 'sw') x = s.px + (s.w - w)
          if (mode === 'nw' || mode === 'ne') y = s.py + (s.h - h)
        } else {
          if (mode.includes('e')) w = s.w + dx
          if (mode.includes('w')) {
            w = s.w - dx
            x = s.px + dx
          }
          if (mode.includes('s')) h = s.h + dy
          if (mode.includes('n')) {
            h = s.h - dy
            y = s.py + dy
          }
          if (w < MIN_MM) {
            if (mode.includes('w')) x -= MIN_MM - w
            w = MIN_MM
          }
          if (h < MIN_MM) {
            if (mode.includes('n')) y -= MIN_MM - h
            h = MIN_MM
          }
        }
      }
      onChange(el.id, { position: { x: r1(x), y: r1(y) }, size: { width: r1(w), height: r1(h) } })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      setGuides({ v: [], h: [] })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
  }

  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  return (
    <>
      {sorted
        .filter((e) => e.visible !== false && e.position && e.size)
        .map((e) => {
          const sel = selectedId === e.id
          const pos = e.position as { x: number; y: number }
          const size = e.size as { width: number; height: number }
          const src = e.assetId ? urls[e.assetId] : undefined
          return (
            <div
              key={e.id}
              ref={(n) => {
                nodes.current[e.id] = n
              }}
              onPointerDown={(ev) => begin(ev, e, 'move')}
              className={`absolute select-none ${e.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
                sel ? 'ring-2 ring-[#0C447C]' : 'hover:ring-1 hover:ring-[#14B8A6]'
              }`}
              style={{
                left: pos.x * MM_TO_PX,
                top: pos.y * MM_TO_PX,
                width: size.width * MM_TO_PX,
                height: size.height * MM_TO_PX,
                transform: `rotate(${e.rotation ?? 0}deg)`,
                opacity: e.opacity ?? 1,
                zIndex: 10 + (e.zIndex ?? 1),
                touchAction: 'none',
              }}
            >
              {e.type === 'text_box' ? (
                <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words leading-snug" style={textBoxCss(e)}>
                  {e.config?.text || <span className="opacity-40">…</span>}
                </div>
              ) : src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" draggable={false} className="pointer-events-none h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center border border-dashed border-slate-400 bg-white/70 text-[10px] font-semibold text-slate-600">
                  {e.type === 'qr' || e.type === 'signature_qr' ? (
                    <span className="grid h-3/5 w-3/5 grid-cols-5 grid-rows-5 gap-px" aria-hidden>
                      {Array.from({ length: 25 }, (_, i) => (
                        <span key={i} className={[0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 22, 23, 24].includes(i) ? 'bg-slate-700' : 'bg-slate-200'} />
                      ))}
                    </span>
                  ) : (
                    e.type
                  )}
                </div>
              )}

              {sel && !e.locked && (
                <>
                  {HANDLES.map((h) => (
                    <span
                      key={h.mode}
                      onPointerDown={(ev) => begin(ev, e, h.mode)}
                      className={`absolute h-3 w-3 rounded-sm border border-[#0C447C] bg-white ${h.cls}`}
                      style={{ cursor: h.cursor, touchAction: 'none' }}
                    />
                  ))}
                  <span
                    onPointerDown={(ev) => begin(ev, e, 'rotate')}
                    className="absolute -top-7 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-[#0C447C] bg-[#14B8A6]"
                    style={{ touchAction: 'none' }}
                    aria-label="rotate"
                  />
                </>
              )}
            </div>
          )
        })}

      {guides.v.map((x) => (
        <div key={`v${x}`} className="pointer-events-none absolute top-0 h-full w-px bg-[#14B8A6]" style={{ left: x * MM_TO_PX, zIndex: 999 }} />
      ))}
      {guides.h.map((y) => (
        <div key={`h${y}`} className="pointer-events-none absolute left-0 h-px w-full bg-[#14B8A6]" style={{ top: y * MM_TO_PX, zIndex: 999 }} />
      ))}
    </>
  )
}

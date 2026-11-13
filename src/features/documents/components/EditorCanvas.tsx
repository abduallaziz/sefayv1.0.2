'use client'

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { MM_TO_PX } from '../lib/elements'

export interface FreeSpot {
  x: number
  y: number
  width: number
  scale?: number
}

interface Props {
  html: string
  widthMm: number
  heightMm: number
  zoom: number
  selectedId: string | null
  /** Flow blocks are located inside the rendered page, so a click on one selects it. */
  onSelect: (id: string | null) => void
  /** Dragging any block places it freely at its current spot (and moves it from then on). */
  onFreeMove?: (id: string, spot: FreeSpot) => void
  /** Current free spots by block id, so a selected free block can be resized. */
  frees?: Record<string, FreeSpot>
  /** Block names by id, shown above a hovered / selected block so you know what you are moving. */
  labels?: Record<string, string>
  /** Called once when a drag starts, so the whole gesture is ONE undo step. */
  onGestureStart?: () => void
  /** Overlay layer (stamps, signatures ...) drawn in page coordinates above the rendered page. */
  children?: ReactNode
}

interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
}

/**
 * The page surface. The page itself is the server-rendered HTML in a script-less sandboxed iframe
 * (so canvas == PDF); a transparent layer on top gives every block a click target and a selection
 * outline, and hosts the live overlay elements. Coordinates are CSS px at zoom 1; the whole stack
 * is scaled together with a CSS transform.
 */
export function EditorCanvas({
  html,
  widthMm,
  heightMm,
  zoom,
  selectedId,
  onSelect,
  onFreeMove,
  frees,
  labels,
  onGestureStart,
  children,
}: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  // boxes being dragged / resized right now, ahead of the re-rendered page
  const [live, setLive] = useState<Record<string, Box>>({})
  const [contentH, setContentH] = useState(0)
  const w = Math.round(widthMm * MM_TO_PX)
  const h = Math.round(heightMm * MM_TO_PX)
  // long documents flow onto further printed pages: show as many page-sized sheets as the content needs
  const pageCount = Math.max(1, Math.ceil((contentH - 2) / h))
  const totalH = pageCount * h

  const measure = useCallback(() => {
    const doc = frame.current?.contentDocument
    if (!doc) return
    const out: Box[] = []
    doc.querySelectorAll<HTMLElement>('[data-el]').forEach((el) => {
      const r = el.getBoundingClientRect()
      const id = el.getAttribute('data-el')
      if (id) out.push({ id, x: r.left, y: r.top, w: r.width, h: r.height })
    })
    setBoxes(out)
    setLive({})
    setContentH(doc.querySelector('.page')?.getBoundingClientRect().height ?? 0)
  }, [])

  /** Live look while a gesture runs: the server page re-renders a moment later, this shows it NOW. */
  const showLive = (id: string, box: Box, mode: 'move' | 'e' | 'w' | 'se', ps: number) => {
    const nat = boxes.find((x) => x.id === id)
    const node = frame.current?.contentDocument?.querySelector<HTMLElement>('[data-el="' + id + '"]')
    setLive((p) => ({ ...p, [id]: box }))
    if (!nat || !node) return
    node.style.transformOrigin = 'top left'
    if (mode === 'e' || mode === 'w') {
      node.style.width = box.w / ps + 'px'
      node.style.transform = 'translate(' + (box.x - nat.x) / ps + 'px,0)'
    } else if (mode === 'se') {
      node.style.transform = 'scale(' + box.w / nat.w + ')'
    } else {
      node.style.transform = 'translate(' + (box.x - nat.x) / ps + 'px,' + (box.y - nat.y) / ps + 'px)'
    }
  }

  const dragBlock = (ev: ReactPointerEvent, b0: Box) => {
    onSelect(b0.id)
    if (!onFreeMove) return
    ev.preventDefault()
    const b = live[b0.id] ?? b0
    const start = { x: ev.clientX, y: ev.clientY }
    const r1 = (n: number) => Math.round(n * 10) / 10
    const f = frees?.[b.id]
    const ps = f?.scale ?? 1
    const widthMm = f?.width ?? b.w / MM_TO_PX
    let began = false
    const move = (e: PointerEvent) => {
      const dx = (e.clientX - start.x) / zoom
      const dy = (e.clientY - start.y) / zoom
      if (!began) {
        if (Math.hypot(dx, dy) * zoom < 4) return // a plain click only selects
        began = true
        onGestureStart?.()
      }
      const box = { ...b, x: b.x + dx, y: b.y + dy }
      showLive(b.id, box, 'move', ps)
      onFreeMove(b.id, { x: r1(box.x / MM_TO_PX), y: r1(box.y / MM_TO_PX), width: r1(widthMm) })
    }
    const up = () => window.removeEventListener('pointermove', move)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
  }

  /** Resize a free block: sides change its width, the corner scales it (bigger / smaller). */
  const resizeBlock = (ev: ReactPointerEvent, b0: Box, mode: 'e' | 'w' | 'se') => {
    const f = frees?.[b0.id]
    if (!f || !onFreeMove) return
    ev.stopPropagation()
    ev.preventDefault()
    onSelect(b0.id)
    onGestureStart?.()
    const b = live[b0.id] ?? b0
    const sx = ev.clientX
    const r1 = (n: number) => Math.round(n * 10) / 10
    const scale = f.scale ?? 1
    const move = (e: PointerEvent) => {
      const dx = (e.clientX - sx) / zoom
      if (mode === 'e') {
        const w = Math.max(5 * MM_TO_PX * scale, b.w + dx)
        showLive(b.id, { ...b, w }, 'e', scale)
        onFreeMove(b.id, { ...f, width: r1(w / MM_TO_PX / scale) })
      } else if (mode === 'w') {
        const w = Math.max(5 * MM_TO_PX * scale, b.w - dx)
        const x = b.x + (b.w - w)
        showLive(b.id, { ...b, x, w }, 'w', scale)
        onFreeMove(b.id, { ...f, x: r1(x / MM_TO_PX), width: r1(w / MM_TO_PX / scale) })
      } else {
        const s = Math.min(5, Math.max(0.2, scale * ((b.w + dx) / b.w)))
        const r = s / scale
        showLive(b.id, { ...b, w: b.w * r, h: b.h * r }, 'se', scale)
        onFreeMove(b.id, { ...f, scale: Math.round(s * 100) / 100 })
      }
    }
    const up = () => window.removeEventListener('pointermove', move)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
  }

  return (
    <div
      className="relative shrink-0 shadow-lg ring-1 ring-slate-300 dark:ring-gray-700"
      style={{ width: w * zoom, height: totalH * zoom }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: w, height: totalH, transform: `scale(${zoom})` }}
      >
        <iframe
          ref={frame}
          title="page"
          sandbox="allow-same-origin"
          srcDoc={html}
          onLoad={measure}
          className="block border-0 bg-white"
          style={{ width: w, height: totalH }}
        />
        <div className="absolute inset-0" onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
          {boxes.map((b0) => {
            const b = live[b0.id] ?? b0
            return (
            <button
              key={b.id}
              type="button"
              aria-label={b.id}
              onPointerDown={(ev) => dragBlock(ev, b0)}
              className={`group absolute rounded-sm outline-none transition-colors ${
                selectedId === b.id
                  ? 'bg-[#0C447C]/5 ring-2 ring-[#0C447C]'
                  : 'hover:bg-[#14B8A6]/10 hover:ring-1 hover:ring-[#14B8A6]'
              } ${onFreeMove ? 'cursor-move' : ''}`}
              style={{ touchAction: 'none', left: b.x, top: b.y, width: b.w, height: b.h }}
            >
              {labels?.[b.id] && (
                <span
                  className={`pointer-events-none absolute -top-5 start-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold text-white ${
                    selectedId === b.id ? 'bg-[#0C447C]' : 'hidden bg-[#14B8A6] group-hover:block'
                  }`}
                >
                  {labels[b.id]}
                </span>
              )}
              {selectedId === b.id && frees?.[b.id] && (
                <>
                  {(
                    [
                      ['w', '-left-1.5 top-1/2 -translate-y-1/2', 'ew-resize'],
                      ['e', '-right-1.5 top-1/2 -translate-y-1/2', 'ew-resize'],
                      ['se', '-right-1.5 -bottom-1.5', 'nwse-resize'],
                    ] as const
                  ).map(([mode, cls, cursor]) => (
                    <span
                      key={mode}
                      onPointerDown={(ev) => resizeBlock(ev, b, mode)}
                      className={`absolute h-3 w-3 rounded-sm border border-[#0C447C] bg-white ${cls}`}
                      style={{ cursor, touchAction: 'none' }}
                    />
                  ))}
                </>
              )}
            </button>
            )
          })}
          {Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 w-full border-t-2 border-dashed border-[#14B8A6]"
              style={{ top: (i + 1) * h, zIndex: 998 }}
            >
              <span className="absolute end-1 top-0.5 rounded bg-[#14B8A6] px-1.5 text-[10px] font-semibold text-white">
                {i + 2}
              </span>
            </div>
          ))}
          {children}
        </div>
      </div>
    </div>
  )
}

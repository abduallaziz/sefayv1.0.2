'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { MM_TO_PX } from '../lib/elements'

interface Props {
  html: string
  widthMm: number
  heightMm: number
  zoom: number
  selectedId: string | null
  /** Flow blocks are located inside the rendered page, so a click on one selects it. */
  onSelect: (id: string | null) => void
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
export function EditorCanvas({ html, widthMm, heightMm, zoom, selectedId, onSelect, children }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
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
    setContentH(doc.querySelector('.page')?.getBoundingClientRect().height ?? 0)
  }, [])

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
          {boxes.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-label={b.id}
              onClick={() => onSelect(b.id)}
              className={`absolute rounded-sm outline-none transition-colors ${
                selectedId === b.id
                  ? 'bg-[#0C447C]/5 ring-2 ring-[#0C447C]'
                  : 'hover:bg-[#14B8A6]/10 hover:ring-1 hover:ring-[#14B8A6]'
              }`}
              style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            />
          ))}
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

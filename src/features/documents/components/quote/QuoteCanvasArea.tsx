'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Grid3x3, Minus, Plus } from 'lucide-react'
import { MM_TO_PX } from '../../lib/elements'
import { PAPERS, type Paper } from '../../types'

interface Props {
  widthMm: number
  heightMm: number
  zoom: number
  paper: Paper
  showGrid: boolean
  dir: 'rtl' | 'ltr'
  onZoom: (z: number) => void
  onPaper: (p: Paper) => void
  onGrid: (v: boolean) => void
  children: ReactNode
}

const RULER = 22

function Ruler({ lengthMm, ppm, vertical }: { lengthMm: number; ppm: number; vertical?: boolean }) {
  const labelEvery = ppm * 10 < 26 ? 40 : ppm * 10 < 40 ? 20 : 10
  const ticks: { mm: number; major: boolean; label: boolean }[] = []
  for (let mm = 0; mm <= lengthMm; mm += 5) {
    ticks.push({ mm, major: mm % 10 === 0, label: mm % labelEvery === 0 })
  }
  const len = lengthMm * ppm
  return (
    <div
      aria-hidden
      className="relative select-none overflow-hidden bg-white text-[9px] text-slate-500 dark:bg-gray-900"
      style={vertical ? { width: RULER, height: len } : { height: RULER, width: len }}
    >
      {ticks.map((tk) => {
        const pos = tk.mm * ppm
        return vertical ? (
          <span key={tk.mm} className="absolute right-0" style={{ top: pos }}>
            <span className="absolute right-0 block bg-slate-400" style={{ height: 1, width: tk.major ? 8 : 4 }} />
            {tk.label && (
              <span className="absolute right-2.5 -translate-y-1/2" style={{ top: 0 }}>
                {tk.mm}
              </span>
            )}
          </span>
        ) : (
          <span key={tk.mm} className="absolute bottom-0" style={{ left: pos }}>
            <span className="absolute bottom-0 block bg-slate-400" style={{ width: 1, height: tk.major ? 8 : 4 }} />
            {tk.label && (
              <span className="absolute bottom-2.5 -translate-x-1/2" style={{ left: 0 }}>
                {tk.mm}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

export function QuoteCanvasArea({ widthMm, heightMm, zoom, paper, showGrid, dir, onZoom, onPaper, onGrid, children }: Props) {
  const tq = useTranslations('documents.quote')
  const te = useTranslations('documents.editor')
  const ppm = MM_TO_PX * zoom

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto w-max min-w-full">
          <div
            dir="ltr"
            className="mx-auto grid w-max"
            style={{ gridTemplateColumns: `${RULER}px auto`, gridTemplateRows: `${RULER}px auto` }}
          >
            <div className="bg-white dark:bg-gray-900" />
            <Ruler lengthMm={widthMm} ppm={ppm} />
            <Ruler lengthMm={heightMm} ppm={ppm} vertical />
            <div dir={dir} className="relative">
              {children}
              {showGrid && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0"
                  style={{
                    width: widthMm * ppm,
                    height: heightMm * ppm,
                    backgroundImage:
                      'linear-gradient(to right, rgba(12,68,124,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,68,124,.12) 1px, transparent 1px)',
                    backgroundSize: `${10 * ppm}px ${10 * ppm}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-800">
          <button type="button" className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-gray-800" aria-label="-" onClick={() => onZoom(Math.max(0.3, +(zoom - 0.1).toFixed(2)))}>
            <Minus className="mx-auto h-4 w-4" />
          </button>
          <span className="w-14 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <button type="button" className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-gray-800" aria-label="+" onClick={() => onZoom(Math.min(2, +(zoom + 0.1).toFixed(2)))}>
            <Plus className="mx-auto h-4 w-4" />
          </button>
        </div>

        <select
          value={paper}
          aria-label={tq('paperSize')}
          onChange={(e) => onPaper(e.target.value as Paper)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-gray-700 dark:bg-gray-900"
        >
          {PAPERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-gray-300">
          <Grid3x3 className="h-4 w-4" aria-hidden />
          {tq('showGrid')}
          <input type="checkbox" checked={showGrid} onChange={(e) => onGrid(e.target.checked)} className="h-4 w-4 accent-[#0C447C]" />
        </label>
        <span className="sr-only">{te('zoom')}</span>
      </div>
    </div>
  )
}

// Continuous day series: days without sales are filled with 0 so the chart
// time axis is proportional (a 3-month gap must be visible as a gap).
export function fillMissingDays(
  rows: { date: string; total: number }[],
  from?: string,
  to?: string,
): { date: string; total: number }[] {
  if (rows.length === 0) return []
  const byDate = new Map(rows.map((r) => [r.date, r.total]))
  const sorted = [...byDate.keys()].sort()
  const start = from && from < sorted[0] ? from : sorted[0]
  const end = to && to > sorted[sorted.length - 1] ? to : sorted[sorted.length - 1]
  const out: { date: string; total: number }[] = []
  const d = new Date(`${start}T00:00:00Z`)
  const last = new Date(`${end}T00:00:00Z`)
  // Safety cap: never build more than ~2 years of points.
  for (let i = 0; d <= last && i < 800; i++) {
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, total: byDate.get(key) ?? 0 })
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Rows -> CSV text (CRLF, UTF-8 BOM added by the caller when downloading).
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

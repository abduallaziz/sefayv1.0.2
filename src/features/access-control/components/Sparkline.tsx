'use client'

// Deterministic decorative sparkline seeded from a string (role/stat id) so
// it's stable across renders without needing real time-series data (none
// exists on the backend for this yet).
function seededPoints(seed: string, count: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const points: number[] = []
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    points.push(8 + (h % 1000) / 1000 * 22)
  }
  return points
}

export function Sparkline({ seed, color }: { seed: string; color: string }) {
  const values = seededPoints(seed, 9)
  const points = values.map((v, i) => `${i * 25},${32 - v}`).join(' ')
  return (
    <svg className="w-full h-8 mt-2.5" viewBox="0 0 200 40" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

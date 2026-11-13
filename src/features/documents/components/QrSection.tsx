'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/shared/ui/input'
import { documentsApi } from '../api/documents.api'
import type { TemplateElement } from '../types'

const label = 'text-xs font-medium text-slate-600 dark:text-gray-400'
const KINDS = ['verification', 'zatca', 'payment', 'custom_url'] as const

function isHttps(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && !u.username && !u.password
  } catch {
    return false
  }
}

/** Inspector controls for a QR element: what it encodes, and a live "can it be scanned" check. */
export function QrSection({
  element,
  onElement,
}: {
  element: TemplateElement
  onElement: (patch: Partial<TemplateElement>) => void
}) {
  const te = useTranslations('documents.editor')
  const catalog = useQuery({ queryKey: ['documents', 'bindings'], queryFn: documentsApi.bindings, staleTime: 10 * 60_000 })
  const kind = (element.type === 'signature_qr' ? 'verification' : element.config?.kind) as (typeof KINDS)[number] | undefined
  const url = typeof element.config?.url === 'string' ? element.config.url : ''
  const side = element.size ? Math.min(element.size.width, element.size.height) : 0
  // custom links are sized by their own length on the server; here we only know the fixed kinds
  const min = kind && kind !== 'custom_url' ? catalog.data?.qrMinSizeMm?.[kind] : undefined
  const tooSmall = min !== undefined && side < min

  return (
    <section className="space-y-3">
      <h4 className={label}>{te('qr.title')}</h4>
      {element.type === 'qr' && (
        <div className="space-y-1">
          <label className={label}>{te('qr.kind')}</label>
          <select
            className="h-9 w-full rounded border border-posCloud-border bg-posCloud-background px-3 text-sm dark:border-posCloudDark-border dark:bg-posCloudDark-background"
            value={kind}
            onChange={(e) => {
              const k = e.target.value as (typeof KINDS)[number]
              onElement({ config: { kind: k, ...(k === 'custom_url' ? { url: url || 'https://example.com' } : {}) } })
            }}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {te(`qr.${k}`)}
              </option>
            ))}
          </select>
        </div>
      )}
      {kind === 'custom_url' && element.type === 'qr' && (
        <div className="space-y-1">
          <label className={label}>{te('qr.url')}</label>
          <Input
            dir="ltr"
            value={url}
            maxLength={500}
            onChange={(e) => onElement({ config: { kind: 'custom_url', url: e.target.value } })}
          />
          {!isHttps(url) && <p className="text-xs font-medium text-posCloud-danger">{te('qr.urlInvalid')}</p>}
        </div>
      )}
      {min !== undefined && (
        <p className={`text-xs ${tooSmall ? 'font-medium text-posCloud-danger' : 'text-slate-500'}`}>
          {te('qr.minSize', { mm: min })}
          {tooSmall && ` - ${te('qr.tooSmall')}`}
        </p>
      )}
      <p className="text-xs text-slate-500">{te('qr.hint')}</p>
    </section>
  )
}

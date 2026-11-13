'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BadgeCheck, Loader2, ShieldAlert, ShieldX } from 'lucide-react'

interface Result {
  valid: boolean
  status: 'issued' | 'void'
  doc_type: string
  issued_at: string
  fields: Record<string, string>
}

type State = { kind: 'loading' } | { kind: 'notfound' } | { kind: 'ok'; data: Result }

/**
 * Public, read-only verification page reached from a document's QR code. No actions, no login:
 * it only displays the fields the issuer chose to expose.
 */
export function PublicDocumentView({ token }: { token: string }) {
  const t = useTranslations('documents')
  const tv = useTranslations('documents.verify')
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/v1/public/verify/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) return setState({ kind: 'notfound' })
        setState({ kind: 'ok', data: (await res.json()) as Result })
      })
      .catch(() => !cancelled && setState({ kind: 'notfound' }))
    return () => {
      cancelled = true
    }
  }, [token])

  const row = (label: string, value?: string) =>
    value ? (
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-gray-800">
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="text-end text-sm font-semibold text-slate-800 dark:text-white" dir="auto">
          {value}
        </dd>
      </div>
    ) : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-10 dark:bg-gray-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-[#0C447C] dark:text-[#5B9BD5]">{tv('title')}</h1>

        {state.kind === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-10 text-slate-500" role="status">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span className="text-sm">{tv('loading')}</span>
          </div>
        )}

        {state.kind === 'notfound' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center" role="alert">
            <ShieldX className="h-12 w-12 text-posCloud-danger" aria-hidden />
            <p className="text-base font-semibold text-slate-800 dark:text-white">{tv('notFound')}</p>
            <p className="text-sm text-slate-500">{tv('notFoundHint')}</p>
          </div>
        )}

        {state.kind === 'ok' && (
          <>
            <div className="mb-4 flex flex-col items-center gap-2 text-center" role="status">
              {state.data.valid ? (
                <BadgeCheck className="h-12 w-12 text-posCloud-success" aria-hidden />
              ) : (
                <ShieldAlert className="h-12 w-12 text-posCloud-warning" aria-hidden />
              )}
              <p className="text-base font-semibold text-slate-800 dark:text-white">{state.data.valid ? tv('valid') : tv('void')}</p>
            </div>
            <dl>
              {row(tv('type'), t.has(`type.${state.data.doc_type}`) ? t(`type.${state.data.doc_type}` as never) : state.data.doc_type)}
              {row(tv('number'), state.data.fields.document_number)}
              {row(tv('date'), state.data.fields.document_date)}
              {row(tv('issuer'), state.data.fields.issuer_name)}
              {row(tv('vat'), state.data.fields.issuer_vat_number)}
              {row(tv('total'), state.data.fields.total)}
              {row(tv('issuedAt'), state.data.issued_at.slice(0, 10))}
            </dl>
          </>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">{tv('viewOnly')}</p>
      </section>
    </main>
  )
}

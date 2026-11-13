'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { documentsApi } from '../api/documents.api'
import { useTemplateDraft } from '../hooks/useTemplateDraft'
import { EditorToolbar } from '../components/EditorToolbar'
import { EditorCanvas } from '../components/EditorCanvas'
import { ElementsPanel } from '../components/ElementsPanel'
import { Inspector } from '../components/Inspector'
import { ApprovalDialog } from '../components/ApprovalDialog'
import { OverlayLayer } from '../components/OverlayLayer'
import {
  duplicateElement,
  newQrElement,
  type QrKind,
  isOverlay,
  maxZ,
  moveFlow,
  newFlowElement,
  newOverlayElement,
  removeElement,
  updateElement,
} from '../lib/elements'
import { paperSizeMm, type DocumentAsset, type FlowType, type OverlayType, type TemplateElement } from '../types'

const OVERLAY_FOR_CATEGORY: Record<string, OverlayType> = {
  signature: 'signature',
  logo: 'logo',
  image: 'image',
  company_stamp: 'stamp',
  branch_stamp: 'stamp',
  department_stamp: 'stamp',
}

export function TemplateEditorPage({ id }: { id: string }) {
  const t = useTranslations('documents')
  const locale = useLocale()
  const qc = useQueryClient()
  const draft = useTemplateDraft(id)
  const { state, edit, undo, redo, save, checkpoint } = draft
  const assetsQ = useQuery({
    queryKey: ['documents', 'assets', 'active'],
    queryFn: () => documentsApi.assets({ status: 'active' }),
  })
  // signed URLs of the assets in use; kept stable between previews so images don't flicker
  const [urlEntries, setUrls] = useState<Record<string, { url: string; at: number }>>({})

  const [zoom, setZoom] = useState(0.8)
  const [lang, setLang] = useState<'ar' | 'en'>(locale === 'en' ? 'en' : 'ar')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [html, setHtml] = useState('')
  const [busy, setBusy] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const bindingsQ = useQuery({ queryKey: ['documents', 'bindings'], queryFn: documentsApi.bindings, staleTime: 10 * 60_000 })

  const selected: TemplateElement | null = useMemo(
    () => state?.body.elements.find((e) => e.id === selectedId) ?? null,
    [state, selectedId],
  )

  // Live page: the SAME renderer the PDF uses, fed the unsaved draft (overlays are drawn by the canvas).
  useEffect(() => {
    if (!state) return
    let cancelled = false
    const h = setTimeout(async () => {
      try {
        const r = await documentsApi.previewHtml(id, {
          body: state.body,
          paper: state.paper,
          orientation: state.orientation,
          lang,
          overlays: false,
        })
        if (!cancelled) {
          setHtml(r.html)
          setWarnings(r.warnings ?? [])
          const now = Date.now()
          setUrls((prev) => {
            const next = { ...prev }
            for (const [k, v] of Object.entries(r.assetUrls ?? {})) {
              // signed URLs live 5 min: keep the current one while it is fresh, renew it afterwards
              if (!next[k] || now - next[k].at > 240_000) next[k] = { url: v, at: now }
            }
            return next
          })
        }
      } catch {
        /* keep the last good render */
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(h)
    }
  }, [id, state, lang])

  const setSelected = useCallback((next: string | null) => setSelectedId(next), [])

  const urls = useMemo(
    () => Object.fromEntries(Object.entries(urlEntries).map(([k, v]) => [k, v.url])),
    [urlEntries],
  )

  const addAsset = useCallback(
    (a: DocumentAsset) => {
      const type = OVERLAY_FOR_CATEGORY[a.category] ?? 'image'
      // default ~35mm wide, keeping the picture's own proportions
      const ratio = a.width_px && a.height_px ? a.width_px / a.height_px : 1
      const width = 35
      const height = Math.max(5, Math.round((width / ratio) * 10) / 10)
      edit((s) => {
        const el = newOverlayElement(type, a.id, { width, height }, maxZ(s.body) + 1)
        setSelectedId(el.id)
        return { ...s, body: { ...s.body, elements: [...s.body.elements, el] } }
      })
    },
    [edit],
  )

  const addQr = useCallback(
    (type: 'qr' | 'signature_qr', kind: QrKind) => {
      const min = kind === 'custom_url' ? 25 : (bindingsQ.data?.qrMinSizeMm?.[kind] ?? 30)
      edit((s) => {
        const el = newQrElement(type, kind, min, maxZ(s.body) + 1)
        setSelectedId(el.id)
        return { ...s, body: { ...s.body, elements: [...s.body.elements, el] } }
      })
    },
    [edit, bindingsQ.data],
  )

  // overlay geometry changes during a drag are not individual undo steps (checkpoint() groups them)
  const changeOverlay = useCallback(
    (id: string, patch: Partial<TemplateElement>) =>
      edit((s) => ({ ...s, body: updateElement(s.body, id, patch) }), false),
    [edit],
  )

  const remove = useCallback(() => {
    if (!selectedId) return
    edit((s) => ({ ...s, body: removeElement(s.body, selectedId) }))
    setSelectedId(null)
  }, [edit, selectedId])

  const duplicate = useCallback(() => {
    if (!selectedId || !state) return
    const r = duplicateElement(state.body, selectedId)
    edit((s) => ({ ...s, body: r.body }))
    setSelectedId(r.newId)
  }, [edit, selectedId, state])

  // keyboard shortcuts (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      } else if (!typing && mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (!typing && mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        remove()
      } else if (!typing && e.key === 'Escape') {
        setSelectedId(null)
      } else if (!typing && selectedId && e.key.startsWith('Arrow')) {
        // nudge a selected overlay: 1 mm, or 10 mm with Shift
        const sel = state?.body.elements.find((x) => x.id === selectedId)
        if (!sel || !isOverlay(sel) || !sel.position || sel.locked) return
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        edit((s) => ({
          ...s,
          body: updateElement(s.body, selectedId, { position: { x: sel.position!.x + dx, y: sel.position!.y + dy } }),
        }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, undo, redo, remove, selectedId, state, edit])

  if (draft.error) return <div className="p-6 text-sm text-posCloud-danger">{t('failed')}</div>
  if (draft.loading || !state || !draft.detail) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
      </div>
    )
  }

  const size = paperSizeMm(state.paper, state.orientation)
  const detail = draft.detail

  const doPublish = async () => {
    setBusy(true)
    try {
      await save()
      await documentsApi.publish(id)
      await qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success(t('published'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('failed'))
    } finally {
      setBusy(false)
    }
  }

  const doPdf = async () => {
    setBusy(true)
    try {
      await save()
      const blob = await documentsApi.pdf(id, lang)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state.name || 'template'}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[32rem] flex-col bg-[#F5F7FA] dark:bg-gray-950">
      <EditorToolbar
        name={state.name}
        templateStatus={detail.status}
        saveStatus={draft.status}
        zoom={zoom}
        lang={lang}
        canUndo={draft.canUndo}
        canRedo={draft.canRedo}
        busy={busy}
        onZoom={setZoom}
        onLang={setLang}
        onUndo={undo}
        onRedo={redo}
        onSave={() => void save()}
        onPublish={() => void doPublish()}
        onPdf={() => void doPdf()}
        onApproval={() => setApprovalOpen(true)}
      />
      <ApprovalDialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        templateId={id}
        templateStatus={detail.status}
      />

      {warnings.length > 0 && (
        <div role="alert" className="border-b border-posCloud-warning/30 bg-posCloud-warning-light px-4 py-2 text-xs text-posCloud-warning">
          <strong>{t('editor.qr.warnings')}:</strong> {warnings.join(' · ')}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="max-h-64 shrink-0 overflow-y-auto border-b border-slate-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 lg:max-h-none lg:w-64 lg:border-b-0 lg:border-e">
          <ElementsPanel
            elements={state.body.elements}
            selectedId={selectedId}
            onSelect={setSelected}
            onAdd={(type: FlowType) => {
              const el = newFlowElement(type)
              edit((s) => ({ ...s, body: { ...s.body, elements: [...s.body.elements, el] } }))
              setSelectedId(el.id)
            }}
            onMove={(elId, dir) => edit((s) => ({ ...s, body: moveFlow(s.body, elId, dir) }))}
            assets={assetsQ.data ?? []}
            onAddAsset={addAsset}
            onAddQr={addQr}
            onToggleVisible={(elId) =>
              edit((s) => {
                const el = s.body.elements.find((e) => e.id === elId)
                return { ...s, body: updateElement(s.body, elId, { visible: el?.visible === false }) }
              })
            }
          />
        </aside>

        <main className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto flex w-max min-w-full justify-center">
            <EditorCanvas
              html={html}
              widthMm={size.w}
              heightMm={size.h}
              zoom={zoom}
              selectedId={selectedId}
              onSelect={setSelected}
            >
              <OverlayLayer
                elements={state.body.elements.filter(isOverlay)}
                urls={urls}
                zoom={zoom}
                pageWidthMm={size.w}
                pageHeightMm={size.h}
                selectedId={selectedId}
                onSelect={setSelected}
                onChange={changeOverlay}
                onGestureStart={checkpoint}
              />
            </EditorCanvas>
          </div>
        </main>

        <aside className="max-h-96 shrink-0 overflow-y-auto border-t border-slate-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 lg:max-h-none lg:w-72 lg:border-s lg:border-t-0">
          <Inspector
            draft={state}
            element={selected}
            onMeta={(patch) => edit((s) => ({ ...s, ...patch }))}
            onBody={(patch) => edit((s) => ({ ...s, body: { ...s.body, ...patch } }))}
            onMargin={(mm) =>
              edit((s) => ({
                ...s,
                body: {
                  ...s.body,
                  pages: s.body.pages.map((p, i) =>
                    i === 0 ? { ...p, marginsMm: { top: mm, right: mm, bottom: mm, left: mm } } : p,
                  ),
                },
              }))
            }
            onElement={(patch) => selectedId && edit((s) => ({ ...s, body: updateElement(s.body, selectedId, patch) }))}
            onRemove={remove}
            onDuplicate={duplicate}
            pageSizeMm={size}
          />
        </aside>
      </div>
    </div>
  )
}

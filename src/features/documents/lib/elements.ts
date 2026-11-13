import {
  DEFAULT_TABLE_COLUMNS,
  type FlowType,
  type OverlayType,
  type TemplateBody,
  type TemplateElement,
} from '../types'

export const MM_TO_PX = 96 / 25.4

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `el-${Math.random().toString(36).slice(2)}-${Date.now()}`

export function newFlowElement(type: FlowType): TemplateElement {
  const base: TemplateElement = { id: newId(), page: 0, type, region: 'flow' }
  if (type === 'heading') return { ...base, config: { text: '{{document.number}}' } }
  if (type === 'text' || type === 'terms' || type === 'footer') return { ...base, config: { text: '' } }
  if (type === 'items_table') return { ...base, config: { columns: DEFAULT_TABLE_COLUMNS.map((c) => ({ ...c })) } }
  return base
}

export function newOverlayElement(
  type: OverlayType,
  assetId: string | undefined,
  size: { width: number; height: number },
  zIndex: number,
): TemplateElement {
  return {
    id: newId(),
    page: 0,
    type,
    region: 'overlay',
    assetId,
    position: { x: 20, y: 20 },
    size,
    rotation: 0,
    opacity: 1,
    zIndex,
    locked: false,
    visible: true,
    maintainAspect: true,
  }
}

/** A free text box: dragged and resized by hand like an image. */
export function newTextBox(zIndex: number): TemplateElement {
  return {
    ...newOverlayElement('text_box', undefined, { width: 60, height: 10 }, zIndex),
    maintainAspect: false,
    config: { text: '' },
    style: { fontSize: 11 },
  }
}

export const isOverlay = (e: TemplateElement) => e.region === 'overlay'

export function updateElement(body: TemplateBody, id: string, patch: Partial<TemplateElement>): TemplateBody {
  return { ...body, elements: body.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }
}

export function removeElement(body: TemplateBody, id: string): TemplateBody {
  return { ...body, elements: body.elements.filter((e) => e.id !== id) }
}

/** Move a flow element up/down among the FLOW elements only (overlay elements keep their slots). */
export function moveFlow(body: TemplateBody, id: string, dir: -1 | 1): TemplateBody {
  const els = [...body.elements]
  const flowIdx = els.map((e, i) => (isOverlay(e) ? -1 : i)).filter((i) => i >= 0)
  const pos = flowIdx.findIndex((i) => els[i].id === id)
  const target = pos + dir
  if (pos < 0 || target < 0 || target >= flowIdx.length) return body
  const a = flowIdx[pos]
  const b = flowIdx[target]
  ;[els[a], els[b]] = [els[b], els[a]]
  return { ...body, elements: els }
}

export function duplicateElement(body: TemplateBody, id: string): { body: TemplateBody; newId: string | null } {
  const src = body.elements.find((e) => e.id === id)
  if (!src) return { body, newId: null }
  const copy: TemplateElement = {
    ...JSON.parse(JSON.stringify(src)),
    id: newId(),
  }
  if (copy.position) copy.position = { x: copy.position.x + 5, y: copy.position.y + 5 }
  if (copy.zIndex !== undefined) copy.zIndex = copy.zIndex + 1
  const idx = body.elements.findIndex((e) => e.id === id)
  const els = [...body.elements]
  els.splice(idx + 1, 0, copy)
  return { body: { ...body, elements: els }, newId: copy.id }
}

export function maxZ(body: TemplateBody): number {
  return body.elements.reduce((m, e) => Math.max(m, e.zIndex ?? 0), 0)
}

export type QrKind = 'verification' | 'zatca' | 'payment' | 'custom_url'

/** A QR starts square and comfortably above its scannable minimum. */
export function newQrElement(
  type: 'qr' | 'signature_qr',
  kind: QrKind,
  minMm: number,
  zIndex: number,
): TemplateElement {
  const side = Math.max(30, Math.ceil(minMm + 4))
  return {
    id: newId(),
    page: 0,
    type,
    region: 'overlay',
    config: type === 'qr' ? { kind, ...(kind === 'custom_url' ? { url: 'https://example.com' } : {}) } : { kind: 'verification' },
    position: { x: 20, y: 20 },
    size: { width: side, height: side },
    rotation: 0,
    opacity: 1,
    zIndex,
    locked: false,
    visible: true,
    maintainAspect: true,
  }
}

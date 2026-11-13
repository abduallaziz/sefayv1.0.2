export type DocumentType =
  | 'quotation'
  | 'tax_invoice'
  | 'simplified_invoice'
  | 'receipt'
  | 'payment_voucher'
  | 'work_order'
  | 'delivery_note'
  | 'purchase_order'
  | 'customer_statement'
  | 'custom'

export const DOCUMENT_TYPES: DocumentType[] = [
  'quotation',
  'tax_invoice',
  'simplified_invoice',
  'receipt',
  'payment_voucher',
  'work_order',
  'delivery_note',
  'purchase_order',
  'customer_statement',
  'custom',
]

export type TemplateStatus = 'draft' | 'published' | 'archived'
export type Paper = 'A4' | 'A5' | '80mm' | '58mm'
export type Orientation = 'portrait' | 'landscape'

export const PAPERS: Paper[] = ['A4', 'A5', '80mm', '58mm']

/** Paper size in mm (roll papers have no fixed height: the editor shows a tall page). */
export function paperSizeMm(paper: Paper, orientation: Orientation): { w: number; h: number } {
  const base = {
    A4: { w: 210, h: 297 },
    A5: { w: 148, h: 210 },
    '80mm': { w: 80, h: 200 },
    '58mm': { w: 58, h: 200 },
  }[paper]
  const roll = paper === '80mm' || paper === '58mm'
  return orientation === 'landscape' && !roll ? { w: base.h, h: base.w } : base
}

export interface TemplateSummary {
  id: string
  doc_type: DocumentType
  name: string
  description: string | null
  status: TemplateStatus
  is_default: boolean
  paper: Paper
  orientation: Orientation
  current_version_id: string | null
  updated_at: string
}

export type FlowType =
  | 'heading'
  | 'text'
  | 'terms'
  | 'footer'
  | 'divider'
  | 'company_info'
  | 'customer_info'
  | 'document_info'
  | 'payment_details'
  | 'items_table'
  | 'totals'
  | 'page_break'

export const FLOW_TYPES: FlowType[] = [
  'heading',
  'text',
  'terms',
  'footer',
  'divider',
  'company_info',
  'customer_info',
  'document_info',
  'payment_details',
  'items_table',
  'totals',
  'page_break',
]

export type OverlayType = 'stamp' | 'signature' | 'logo' | 'image' | 'qr' | 'signature_qr' | 'text_box'

export interface TableColumn {
  key: string
  label: string
  align?: 'start' | 'center'
  /** Column width in percent (5-100); empty = automatic. */
  width?: number
  bold?: boolean
}

/** Box / typography options of a block (colours are #RRGGBB; sizes in mm, font size in pt). */
export interface ElementStyle {
  bg?: string
  color?: string
  border?: string
  borderWidth?: number
  radius?: number
  padding?: number
  fontSize?: number
  /** Space above the block in mm. */
  spaceBefore?: number
  align?: 'start' | 'center' | 'end'
  weight?: 'normal' | 'bold'
}

/** Side-by-side placement of flow blocks: a block with sideBySide joins the row of the previous one. */
export interface ElementLayout {
  sideBySide?: boolean
  /** Share of the row width in percent (5-100). */
  width?: number
  place?: 'start' | 'center' | 'end'
  /** A vertical line before this column of the row. */
  divider?: boolean
  /** Free spot in page millimetres: the block leaves the flow and can be dragged anywhere. */
  free?: { x: number; y: number; width: number; scale?: number }
}

export interface TemplateElement {
  id: string
  page: number
  type: FlowType | OverlayType
  region: 'flow' | 'overlay'
  config?: { text?: string; columns?: TableColumn[]; zebra?: boolean; repeatHeader?: boolean; [k: string]: unknown }
  // overlay geometry (mm)
  assetId?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  opacity?: number
  zIndex?: number
  locked?: boolean
  visible?: boolean
  maintainAspect?: boolean
  style?: ElementStyle
  layout?: ElementLayout
  /** 'first' = page 1 only (default); 'every' = repeated on every printed page. */
  anchor?: 'first' | 'every'
}

export interface TemplateBody {
  pages: {
    size?: string
    orientation?: string
    marginsMm?: { top: number; right: number; bottom: number; left: number }
  }[]
  elements: TemplateElement[]
  bindings?: string[]
  /** What an empty field prints: nothing (default) or an em dash. */
  missingValue?: 'blank' | 'dash'
}

export interface BindingDef {
  path: string
  group: 'company' | 'branch' | 'customer' | 'document' | 'payment'
  label: { en: string; ar: string }
}

export interface TemplateDetail extends TemplateSummary {
  draft_version: number | null
  body: TemplateBody | null
}

export type AssetCategory =
  | 'company_stamp'
  | 'branch_stamp'
  | 'department_stamp'
  | 'signature'
  | 'logo'
  | 'image'
  | 'qr_config'

export const ASSET_CATEGORIES: AssetCategory[] = [
  'company_stamp',
  'branch_stamp',
  'department_stamp',
  'signature',
  'logo',
  'image',
]

export interface DocumentAsset {
  id: string
  category: AssetCategory
  name: string
  mime: string
  width_px: number | null
  height_px: number | null
  status: 'active' | 'archived'
  branch_id: string | null
  created_at: string
}

export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Item' },
  { key: 'quantity', label: 'Qty', align: 'center' },
  { key: 'unit_price', label: 'Price' },
  { key: 'total', label: 'Total' },
]

export interface GeneratedDocument {
  id: string
  doc_type: DocumentType
  source_ref: string | null
  status: 'issued' | 'void'
  issued_at: string
  issued_by: string | null
  document_number: string | null
}

export interface ApprovalRecord {
  id: string
  doc_type: DocumentType
  template_id: string
  approver_id: string
  decision: 'approved' | 'rejected'
  reason: string | null
  approved_at: string
}

export interface ManualItemInput {
  name: string
  quantity: number
  unit_price: number
  discount?: number
}

export interface IssueInput {
  doc_type: DocumentType
  source_id: string
  template_id?: string
  lang?: 'ar' | 'en'
  input?: {
    customer?: Record<string, string>
    document?: Record<string, string>
    payment?: Record<string, string>
    items: ManualItemInput[]
  }
}

/** Invoices and receipts are issued from a sale; everything else from staff-entered lines. */
export const ORDER_DOC_TYPES: DocumentType[] = ['tax_invoice', 'simplified_invoice', 'receipt']

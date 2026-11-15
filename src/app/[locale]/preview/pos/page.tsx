'use client'

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM POS PROTOTYPE — design-direction proof only (mock data, no backend).
// Standalone preview route (no DashboardLayout), so it never touches the live app.
// Direction: Premium minimal · Sefay blue/white identity · touch-first · full RTL.
// Open at /ar/preview/pos (or /en/preview/pos).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Clock, Monitor,
  CreditCard, Wallet, Receipt, Sparkles, X,
} from 'lucide-react'

type Item = { id: string; name: string; price: number; cat: string; tone: string; stock?: number }

const CATEGORIES = ['الكل', 'مشروبات ساخنة', 'مشروبات باردة', 'حلويات', 'وجبات', 'إضافات'] as const

const ITEMS: Item[] = [
  { id: '1', name: 'قهوة مختصة', price: 18, cat: 'مشروبات ساخنة', tone: 'from-amber-500/15 to-amber-600/5' },
  { id: '2', name: 'كابتشينو', price: 16, cat: 'مشروبات ساخنة', tone: 'from-orange-500/15 to-orange-600/5' },
  { id: '3', name: 'لاتيه', price: 17, cat: 'مشروبات ساخنة', tone: 'from-yellow-600/15 to-amber-700/5' },
  { id: '4', name: 'شاي كرك', price: 8, cat: 'مشروبات ساخنة', tone: 'from-rose-500/15 to-rose-600/5' },
  { id: '5', name: 'آيس لاتيه', price: 19, cat: 'مشروبات باردة', tone: 'from-sky-500/15 to-sky-600/5' },
  { id: '6', name: 'موهيتو', price: 22, cat: 'مشروبات باردة', tone: 'from-emerald-500/15 to-emerald-600/5' },
  { id: '7', name: 'عصير برتقال', price: 14, cat: 'مشروبات باردة', tone: 'from-orange-400/20 to-orange-500/5' },
  { id: '8', name: 'سموذي توت', price: 23, cat: 'مشروبات باردة', tone: 'from-fuchsia-500/15 to-purple-600/5', stock: 0 },
  { id: '9', name: 'تشيز كيك', price: 26, cat: 'حلويات', tone: 'from-amber-400/20 to-yellow-600/5' },
  { id: '10', name: 'كوكيز', price: 12, cat: 'حلويات', tone: 'from-stone-400/20 to-stone-600/5' },
  { id: '11', name: 'كنافة', price: 28, cat: 'حلويات', tone: 'from-orange-500/20 to-red-500/5' },
  { id: '12', name: 'كروسان', price: 15, cat: 'وجبات', tone: 'from-yellow-500/15 to-amber-600/5' },
  { id: '13', name: 'ساندويتش حلومي', price: 24, cat: 'وجبات', tone: 'from-lime-500/15 to-green-600/5' },
  { id: '14', name: 'سلطة سيزر', price: 27, cat: 'وجبات', tone: 'from-green-500/15 to-emerald-600/5' },
  { id: '15', name: 'شوت إسبريسو', price: 6, cat: 'إضافات', tone: 'from-stone-500/20 to-stone-700/5' },
  { id: '16', name: 'كريمة إضافية', price: 4, cat: 'إضافات', tone: 'from-slate-400/20 to-slate-600/5' },
]

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const VAT = 0.15

export default function PosPreviewPage() {
  const [cat, setCat] = useState<string>('الكل')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({ '1': 2, '9': 1 })
  const [mobileCart, setMobileCart] = useState(false)

  const visible = useMemo(
    () =>
      ITEMS.filter(
        (i) => (cat === 'الكل' || i.cat === cat) && (!query || i.name.includes(query.trim())),
      ),
    [cat, query],
  )

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ item: ITEMS.find((i) => i.id === id)!, qty }))
    .filter((l) => l.item)
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0)
  const vat = subtotal * VAT
  const total = subtotal + vat
  const count = lines.reduce((s, l) => s + l.qty, 0)

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
  const dec = (id: string) =>
    setCart((c) => {
      const q = (c[id] ?? 0) - 1
      const n = { ...c }
      if (q <= 0) delete n[id]
      else n[id] = q
      return n
    })
  const removeLine = (id: string) => setCart((c) => { const n = { ...c }; delete n[id]; return n })

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--surface-bg)] text-[var(--text-primary)]">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{ background: 'radial-gradient(900px 400px at 85% -5%, rgba(12,68,124,0.07), transparent 60%)' }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--surface-border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-2)] shadow-[var(--shadow-brand)]">
            <span className="text-lg font-black text-white">S</span>
          </div>
          <div className="me-auto">
            <h1 className="text-[15px] font-bold leading-tight">نقطة البيع</h1>
            <p className="text-[12px] text-[var(--text-muted)]">الفرع الرئيسي</p>
          </div>

          <Pill icon={Clock} tone="success" label="وردية مفتوحة" />
          <Pill icon={Monitor} tone="brand" label="صندوق 1" />
          <div className="ms-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-light)] text-[13px] font-bold text-[var(--brand-primary)]">
            عز
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 p-4 lg:grid-cols-[1fr_380px] lg:p-6">
        {/* ─── Catalog ─────────────────────────────────────────── */}
        <section className="min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منتج أو امسح الباركود…"
              className="h-[52px] w-full rounded-2xl border border-[var(--surface-border)] bg-white pe-12 ps-4 text-[15px] shadow-[var(--shadow-xs)] outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-sm)]"
            />
          </div>

          {/* Category chips */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const on = c === cat
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={[
                    'h-11 shrink-0 rounded-full px-5 text-[14px] font-semibold transition-all duration-200 active:scale-95',
                    on
                      ? 'bg-[var(--brand-primary)] text-white shadow-[var(--shadow-brand)]'
                      : 'border border-[var(--surface-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]',
                  ].join(' ')}
                >
                  {c}
                </button>
              )
            })}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((it) => {
              const out = it.stock === 0
              const inCart = cart[it.id] ?? 0
              return (
                <button
                  key={it.id}
                  disabled={out}
                  onClick={() => add(it.id)}
                  className={[
                    'group relative overflow-hidden rounded-3xl border bg-white p-3 text-start transition-all duration-200',
                    out
                      ? 'cursor-not-allowed border-[var(--surface-border)] opacity-55'
                      : 'border-[var(--surface-border)] shadow-[var(--shadow-xs)] hover:-translate-y-1 hover:border-transparent hover:shadow-[var(--shadow-lg)] active:translate-y-0 active:scale-[0.98]',
                  ].join(' ')}
                >
                  <div className={`relative mb-3 flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br ${it.tone}`}>
                    <Sparkles className="h-7 w-7 text-[var(--brand-primary)]/40" />
                    {inCart > 0 && (
                      <span className="absolute end-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[12px] font-bold text-white shadow-[var(--shadow-sm)]">
                        {inCart}
                      </span>
                    )}
                    {out && (
                      <span className="absolute inset-x-2 bottom-2 rounded-lg bg-[var(--error-bg)] py-1 text-center text-[11px] font-bold text-[var(--error)]">
                        نفد المخزون
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-[14px] font-bold">{it.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[15px] font-black tabular-nums text-[var(--brand-primary)]" dir="ltr">
                      {money(it.price)} <span className="text-[11px] font-medium text-[var(--text-muted)]">ر.س</span>
                    </span>
                    {!out && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand-primary)] transition group-hover:bg-[var(--brand-primary)] group-hover:text-white">
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ─── Cart (desktop) ──────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-[84px]">
            <CartPanel
              lines={lines}
              subtotal={subtotal}
              vat={vat}
              total={total}
              count={count}
              add={add}
              dec={dec}
              removeLine={removeLine}
            />
          </div>
        </aside>
      </div>

      {/* ─── Cart (mobile bottom bar + sheet) ───────────────────── */}
      {count > 0 && (
        <button
          onClick={() => setMobileCart(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-2xl bg-[var(--brand-primary)] px-5 py-4 text-white shadow-[var(--shadow-xl)] lg:hidden"
        >
          <span className="flex items-center gap-2 font-bold">
            <ShoppingCart className="h-5 w-5" />
            {count} عنصر
          </span>
          <span className="font-black tabular-nums" dir="ltr">{money(total)} ر.س</span>
        </button>
      )}

      {mobileCart && (
        <div className="fixed inset-0 z-40 lg:hidden" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileCart(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-[var(--shadow-xl)]">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--surface-border)]" />
            <CartPanel
              lines={lines}
              subtotal={subtotal}
              vat={vat}
              total={total}
              count={count}
              add={add}
              dec={dec}
              removeLine={removeLine}
              onClose={() => setMobileCart(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Pill({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone: 'success' | 'brand' }) {
  const styles =
    tone === 'success'
      ? 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]'
      : 'bg-[var(--brand-light)] text-[var(--brand-primary)] border-transparent'
  return (
    <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold sm:inline-flex ${styles}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

type CartProps = {
  lines: { item: Item; qty: number }[]
  subtotal: number
  vat: number
  total: number
  count: number
  add: (id: string) => void
  dec: (id: string) => void
  removeLine: (id: string) => void
  onClose?: () => void
}

function CartPanel({ lines, subtotal, vat, total, count, add, dec, removeLine, onClose }: CartProps) {
  return (
    <div className="flex max-h-[calc(100vh-108px)] flex-col overflow-hidden rounded-3xl border border-[var(--surface-border)] bg-white shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-[var(--brand-primary)]" />
          <h2 className="text-[15px] font-bold">الطلب الحالي</h2>
          {count > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand-light)] px-1.5 text-[12px] font-bold text-[var(--brand-primary)]">
              {count}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-muted)]">
              <ShoppingCart className="h-7 w-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-[14px] font-medium text-[var(--text-muted)]">لا توجد منتجات بعد</p>
            <p className="text-[12px] text-[var(--text-muted)]">اضغط على منتج لإضافته</p>
          </div>
        ) : (
          lines.map((l) => (
            <div key={l.item.id} className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-[var(--surface-hover)]">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${l.item.tone}`}>
                <Sparkles className="h-5 w-5 text-[var(--brand-primary)]/40" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[13px] font-bold">{l.item.name}</p>
                <p className="text-[12px] tabular-nums text-[var(--text-muted)]" dir="ltr">
                  {money(l.item.price)} × {l.qty}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-[var(--surface-muted)] p-1">
                <StepBtn onClick={() => dec(l.item.id)} icon={l.qty === 1 ? Trash2 : Minus} danger={l.qty === 1} />
                <span className="w-6 text-center text-[14px] font-bold tabular-nums">{l.qty}</span>
                <StepBtn onClick={() => add(l.item.id)} icon={Plus} />
              </div>
              <button
                onClick={() => removeLine(l.item.id)}
                className="hidden h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--error-bg)] hover:text-[var(--error)] group-hover:opacity-100 lg:flex"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Totals + pay */}
      <div className="border-t border-[var(--surface-border)] bg-[var(--surface-muted)]/60 p-4">
        <Row label="المجموع الفرعي" value={subtotal} muted />
        <Row label="ضريبة القيمة المضافة (15%)" value={vat} muted />
        <div className="my-3 h-px bg-[var(--surface-border)]" />
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[15px] font-bold">الإجمالي</span>
          <span className="text-[22px] font-black tabular-nums text-[var(--brand-primary)]" dir="ltr">
            {money(total)} <span className="text-[13px] font-semibold text-[var(--text-muted)]">ر.س</span>
          </span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <PayChip icon={Wallet} label="نقدًا" active />
          <PayChip icon={CreditCard} label="شبكة" />
          <PayChip icon={Receipt} label="آجل" />
        </div>

        <button
          disabled={lines.length === 0}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[var(--brand-primary)] to-[var(--brand-2)] text-[16px] font-bold text-white shadow-[var(--shadow-brand)] transition-all duration-200 hover:shadow-[var(--shadow-lg)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          إتمام الدفع
          <span className="tabular-nums" dir="ltr">{money(total)} ر.س</span>
        </button>
      </div>
    </div>
  )
}

function StepBtn({ onClick, icon: Icon, danger }: { onClick: () => void; icon: React.ElementType; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[var(--shadow-xs)] transition active:scale-90',
        danger ? 'text-[var(--error)]' : 'text-[var(--brand-primary)]',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" strokeWidth={2.4} />
    </button>
  )
}

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className={muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}>{label}</span>
      <span className="font-semibold tabular-nums text-[var(--text-secondary)]" dir="ltr">{money(value)} ر.س</span>
    </div>
  )
}

function PayChip({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <button
      className={[
        'flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border text-[12px] font-bold transition active:scale-95',
        active
          ? 'border-[var(--brand-primary)] bg-[var(--brand-light)] text-[var(--brand-primary)]'
          : 'border-[var(--surface-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/40',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}

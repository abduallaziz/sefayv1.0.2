'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Search, ImageOff, Plus, Archive, ScanLine, Keyboard, PauseCircle } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { POSItem, POSVariant } from '../types/pos.types'
import { useCatalogItems, useCategories, useItemVariants } from '@/features/items/hooks/useItems'
import { itemsApi } from '@/features/items/api/items.api'
import type { ItemVariant } from '@/features/items/types/item.types'
import { ApiError } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useOpenDrawer } from '@/features/shifts/hooks/useShifts'

// Sefay's real Item model has no image_url field anywhere (confirmed — no
// backend upload feature exists yet, see docs/rebuild/PARKING_LOT.md B3).
// Supersedes the earlier stand-in-photo approach (loremflickr keyed by item
// name + id), which was an explicit decision at the time and is now reversed:
// the grid shows the item's own image_url, or a local placeholder.
//
// Local placeholder — no network request. Previously every card fetched a
// 300x300 image from loremflickr.com, so a 50-card grid meant 50 unoptimized
// requests to a third-party host on every till that opened. On a weak
// connection that dominated POS load time and it depended on a service
// outside our control.
function ImagePlaceholder({ name }: { name: string }) {
  // No photo: a calm tile with the item's first character instead of a big
  // empty box.
  const initial = Array.from(name.trim())[0]?.toUpperCase()
  return (
    <div className="flex h-full w-full items-center justify-center bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15">
      {initial ? (
        <span className="text-3xl font-bold leading-none">{initial}</span>
      ) : (
        <ImageOff className="h-7 w-7" strokeWidth={1.5} />
      )}
    </div>
  )
}

// Premium product-card image: fills its slot edge-to-edge (object-cover,
// no letterboxing), and on load failure swaps to a placeholder that
// occupies exactly the same space — the card layout never collapses or
// reflows either way.
function ProductImage({ item }: { item: POSItem }) {
  const [failed, setFailed] = useState(false)

  // No image on the item, or the real one failed to load: render the local
  // placeholder. It occupies exactly the same box, so the card never reflows.
  if (!item.image_url || failed) return <ImagePlaceholder name={item.name_ar} />

  return (
    <Image
      src={item.image_url}
      alt={item.name_ar}
      fill
      sizes="180px"
      className="object-cover"
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}

// Vertical product card: photo on top, then name / price / quick-add "+". The
// whole card is the click target. Memoized so adding to the cart re-renders
// only the cart, not every card in the grid.
const ProductCard = memo(function ProductCard({ item, currency, onPick, serviceLabel, multipleLabel, outOfStockLabel }: {
  item: POSItem
  currency: string
  onPick: (item: POSItem) => void
  serviceLabel: string
  multipleLabel: string
  outOfStockLabel: string
}) {
  const hasImage = !!item.image_url
  const out = !!item.out_of_stock
  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-posCloud-border bg-posCloud-surface text-start shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-[box-shadow,border-color] duration-150 hover:border-posCloud-primary/40 hover:shadow-[0_8px_20px_rgba(15,23,42,0.10)] active:scale-[0.99] dark:border-posCloudDark-border dark:bg-posCloudDark-surface ${out ? 'grayscale opacity-70' : ''}`}
    >
      {/* Image area: 4:3 with a photo, shorter tile when there is none. */}
      <div className={`relative w-full shrink-0 overflow-hidden ${hasImage ? 'aspect-[16/11] sm:aspect-[4/3]' : 'aspect-[16/9]'}`}>
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
          <ProductImage item={item} />
        </div>
        {(item.type === 'service' || item.has_variants) && (
          <div className="absolute start-2 top-2 flex flex-wrap gap-1">
            {item.type === 'service' && (
              <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{serviceLabel}</span>
            )}
            {item.has_variants && (
              <span className="rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{multipleLabel}</span>
            )}
          </div>
        )}
        {out && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/25">
            <span className="rounded-full bg-slate-700/90 px-3 py-1 text-xs font-semibold text-white">{outOfStockLabel}</span>
          </div>
        )}
      </div>
      {/* Name + price + "+" share one row; a long name keeps its own line(s)
          (max 2) and the price/"+" drop to the next row automatically. */}
      <div className="flex flex-1 flex-wrap content-center items-center gap-x-1.5 gap-y-0.5 px-2 py-1.5">
        <p className="line-clamp-2 min-w-0 max-w-full flex-[1_1_auto] break-words text-xs font-bold leading-snug text-posCloud-text-primary dark:text-posCloudDark-text-primary">
          {item.name_ar}
        </p>
        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <span className="text-[11px] font-bold text-posCloud-primary">{formatNumber(item.price)} {currency}</span>
        </div>
      </div>
    </button>
  )
})

interface Props {
  onAddItem: (item: POSItem, variant?: POSVariant) => void
  onOpenHeldOrders?: () => void
  heldOrdersCount?: number
  /** Rendered next to the product grid, below the full-width top controls. */
  aside?: React.ReactNode
}

function VariantModal({ item, onAddItem, onClose, t }: {
  item: POSItem
  onAddItem: (item: POSItem, variant?: POSVariant) => void
  onClose: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const { data: variants = [], isLoading } = useItemVariants(item.id)
  const currency = useCurrencyDisplay()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-2xl p-5 w-full max-w-sm">
        <h3 className="font-semibold text-lg text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-1">{item.name_ar}</h3>
        <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-4">{t('variant.title')}</p>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="h-10 bg-posCloud-background dark:bg-posCloudDark-background rounded animate-pulse" />
          ) : variants.length === 0 ? (
            <button
              onClick={() => { onAddItem(item); onClose(); }}
              className="flex justify-between items-center p-3 rounded-xl border border-posCloud-border dark:border-posCloudDark-border hover:border-posCloud-primary/40 hover:bg-posCloud-primary-light/50 dark:hover:bg-white/5 transition-all"
            >
              <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.name_ar}</span>
              <span className="text-posCloud-primary font-bold">{formatNumber(item.price)} {currency}</span>
            </button>
          ) : (
            variants.map((v: ItemVariant) => (
              <button
                key={v.id}
                onClick={() => {
                  onAddItem(item, {
                    id: v.id,
                    name: v.name,
                    price_adjustment: v.price_adjustment ?? 0,
                  });
                  onClose();
                }}
                className="flex justify-between items-center p-3 rounded-xl border border-posCloud-border dark:border-posCloudDark-border hover:border-posCloud-primary/40 hover:bg-posCloud-primary-light/50 dark:hover:bg-white/5 transition-all"
              >
                <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{v.name}</span>
                <span className="text-posCloud-primary font-bold">
                  {formatNumber(item.price + (v.price_adjustment ?? 0))} {currency}
                </span>
              </button>
            ))
          )}
        </div>
        <button
          className="w-full mt-3 py-2 border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary rounded-lg text-sm transition-colors"
          onClick={onClose}
        >
          {t('variant.cancel')}
        </button>
      </div>
    </div>
  )
}

export function ItemGrid({ onAddItem, onOpenHeldOrders, heldOrdersCount = 0, aside }: Props) {
  const t = useTranslations('pos')
  const currency = useCurrencyDisplay()
  const [search, setSearch] = useState('')
  // Separate from `search` on purpose: the top scan bar is barcode-only
  // (scanner input or manual barcode entry), not a live product-name
  // filter — it must not share state with the "بحث عن المنتجات" field,
  // which does live-filter the grid as you type a name.
  const [barcodeCode, setBarcodeCode] = useState('')
  // Tracks a genuine user click/touch specifically — NOT plain focus,
  // since the field also carries autoFocus (so a physical scanner can
  // type into it immediately with zero clicks). onFocus fires for both
  // autoFocus-on-mount and a real click, so it can't tell them apart;
  // onMouseDown/onTouchStart only ever fire from an actual pointer
  // interaction, which is what should hide the instructional hint text.
  const [barcodeTouched, setBarcodeTouched] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [variantModal, setVariantModal] = useState<POSItem | null>(null)
  // The catalog can hold thousands of items; rendering every card at once
  // makes the page huge and slow, so the grid shows a batch at a time.
  const PAGE_SIZE = 60
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  // Scan-speed auto-submit: a physical scanner blasts every character in
  // well under ~30ms each (it's not a human typing, it's a device replaying
  // a stored code) — recording inter-keystroke gaps lets us tell "this is a
  // scanner" apart from manual typing without depending on the scanner
  // being configured to send a trailing Enter, which not all of them are.
  const lastKeyTimeRef = useRef<number>(0)
  const keyGapsRef = useRef<number[]>([])
  const barcodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Whole active catalog, accumulated page by page — not one 50-item page.
  // Filtering below stays client-side so search remains instant at the till.
  const { items: rawItems, isLoading } = useCatalogItems()
  const { data: categories = [] } = useCategories()
  const openDrawer = useOpenDrawer()

  const handleOpenDrawer = () => {
    openDrawer.mutate(undefined, {
      onSuccess: () => toast.success(t('drawerOpened')),
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : t('drawerOpenFailed')),
    })
  }

  const items: POSItem[] = rawItems
    .filter(i => i.is_active)
    .map(i => ({
      id: i.id,
      name: i.name,
      name_ar: i.name,
      price: i.price,
      category: i.category_id ?? 'other',
      type: i.type,
      has_variants: i.has_variants,
      variants: [],
      image_url: i.image_url ?? undefined,
      category_name: i.category_name ?? undefined,
      // Only items that track inventory and have no variants carry a live
      // stock_quantity; everything else is never flagged.
      out_of_stock: i.has_inventory && !i.has_variants && i.stock_quantity !== undefined && i.stock_quantity <= 0,
    }))

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.name_ar.includes(search) || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, activeCategory])

  // Stable callback (reads the latest onAddItem from a ref) so memoized cards
  // are not re-rendered on every cart change. A 150ms per-item guard swallows
  // an accidental double-fire without blocking deliberate repeated taps.
  const tRef = useRef(t)
  tRef.current = t
  const onAddItemRef = useRef(onAddItem)
  onAddItemRef.current = onAddItem
  const lastPickRef = useRef<{ id: string; at: number } | null>(null)
  const handleItemClick = useCallback((item: POSItem) => {
    const now = performance.now()
    const last = lastPickRef.current
    if (last && last.id === item.id && now - last.at < 150) return
    lastPickRef.current = { id: item.id, at: now }
    // An item with no stock left cannot be sold from the till.
    if (item.out_of_stock) {
      toast.error(tRef.current('outOfStockBlocked'), { id: 'pos-out-of-stock' })
      return
    }
    if (item.has_variants) {
      setVariantModal(item)
    } else {
      onAddItemRef.current(item)
    }
  }, [])

  // Barcode scanners behave like a keyboard that types the code then presses
  // Enter — a real person typing an item name into a name-search field
  // essentially never does that. Real product barcode → real item/variant
  // lookup via the actual item-barcodes API (Migration 098 + Step 2 backend),
  // not a client-side guess against the already-loaded item list (which
  // wouldn't know about secondary/variant-specific barcodes at all).
  //
  // Parametrized so the dedicated barcode-scan bar and the "search by name
  // or code" field can each supply their own value + own clear-on-success
  // behavior, without sharing state — the scan bar is barcode-only, not a
  // live name filter, per explicit design intent.
  const runBarcodeLookup = async (rawValue: string, onSuccess: () => void, clearOnMiss = false) => {
    const query = rawValue.trim()
    if (!query) return
    try {
      const result = await itemsApi.lookupBarcode(query)
      if (!result.items || !result.items.is_active) {
        toast.error(t('barcodeNotFound'), { id: 'pos-barcode-miss' })
        if (clearOnMiss) onSuccess()
        return
      }
      const posItem: POSItem = {
        id: result.items.id,
        name: result.items.name,
        name_ar: result.items.name,
        price: result.items.price,
        category: 'other',
        type: result.items.type,
        has_variants: result.items.has_variants,
      }
      if (result.item_variants) {
        onAddItem(posItem, {
          id: result.item_variants.id,
          name: result.item_variants.name,
          price_adjustment: result.item_variants.price_adjustment ?? 0,
        })
        toast.success(t('barcodeAdded', { name: result.item_variants.name }))
      } else if (posItem.has_variants) {
        setVariantModal(posItem)
      } else {
        onAddItem(posItem)
        toast.success(t('barcodeAdded', { name: posItem.name_ar }))
      }
      onSuccess()
    } catch (err) {
      // A 404 means the lookup ran and genuinely found no matching barcode
      // — surface that explicitly (per spec). Any other failure (network,
      // 5xx, etc.) falls back silently to the text-search filter below, so
      // a cashier who's just typing a product name and hits Enter by habit
      // never sees error noise for the common case.
      if (err instanceof ApiError && err.status === 404) {
        toast.error(t('barcodeNotFound'), { id: 'pos-barcode-miss' })
        // the scan bar is emptied so the same wrong code is not looked up again
        if (clearOnMiss) onSuccess()
      }
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runBarcodeLookup(search, () => setSearch(''))
  }

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    // Cancel any pending scan-speed auto-submit so a fast scanner that
    // *does* also send Enter (most do) doesn't trigger the lookup twice.
    if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current)
    runBarcodeLookup(barcodeCode, () => setBarcodeCode(''), true)
  }

  const MIN_BARCODE_LENGTH = 6
  const SCANNER_MAX_AVG_GAP_MS = 40
  const AUTO_SUBMIT_DEBOUNCE_MS = 120

  // Fires on every keystroke in the scan bar. Tracks how fast characters
  // are arriving; if the whole code was typed at scanner speed (every
  // real device fires each character a few ms apart — nothing a human
  // types that fast), auto-submits as soon as input pauses, no Enter
  // needed. A human manually typing a barcode has gaps an order of
  // magnitude slower, so this doesn't fire prematurely on genuine manual
  // entry — that path still waits for Enter (handleBarcodeKeyDown).
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBarcodeCode(value)

    const now = performance.now()
    if (value.length === 0) {
      keyGapsRef.current = []
    } else if (lastKeyTimeRef.current) {
      keyGapsRef.current.push(now - lastKeyTimeRef.current)
    }
    lastKeyTimeRef.current = now

    if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current)
    if (value.trim().length < MIN_BARCODE_LENGTH) return

    barcodeDebounceRef.current = setTimeout(() => {
      const gaps = keyGapsRef.current
      const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : Infinity
      if (avgGap <= SCANNER_MAX_AVG_GAP_MS) {
        runBarcodeLookup(value, () => setBarcodeCode(''), true)
        keyGapsRef.current = []
      }
    }, AUTO_SUBMIT_DEBOUNCE_MS)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="text-base font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>

      {/* Compact top bars: on desktop the scan bar and the actions row share
          one line so the cart below starts higher on the page. */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
      {/* Dedicated barcode-scan bar — its own state (barcodeCode), NOT the
          live product-name search below. Purely for a physical scanner or
          manually-typed barcode value; never filters the grid by name. */}
      <div className="relative flex items-center gap-3 rounded-xl border-2 border-posCloud-primary/30 bg-posCloud-primary-light/40 dark:bg-posCloud-primary/10 px-3 py-1.5 lg:min-w-0 lg:flex-1">
        {/* DOM order is deliberately scan-button-first so it renders on the
            visual RIGHT under the page's RTL context, matching the
            reference (keyboard=left, scan=right) — first DOM child sits
            at the right edge in RTL flex flow. */}
        <button
          type="button"
          onClick={() => runBarcodeLookup(barcodeCode, () => setBarcodeCode(''), true)}
          aria-label={t('scanBarcodeHere')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-posCloud-primary text-white hover:bg-posCloud-primary-dark transition-colors"
        >
          <ScanLine className="h-4 w-4" />
        </button>
        <div className="relative h-9 flex-1">
          <input
            ref={barcodeInputRef}
            value={barcodeCode}
            onChange={handleBarcodeChange}
            onKeyDown={handleBarcodeKeyDown}
            onMouseDown={() => setBarcodeTouched(true)}
            onTouchStart={() => setBarcodeTouched(true)}
            autoFocus
            className="h-9 w-full bg-transparent text-center text-sm outline-none text-posCloud-text-primary dark:text-posCloudDark-text-primary"
          />
          {!barcodeCode && !barcodeTouched && (
            <div className="pointer-events-none absolute inset-0 flex min-w-0 flex-col items-center justify-center px-1">
              <span className="max-w-full truncate text-sm leading-tight text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('scanBarcodeHere')}</span>
              <span className="max-w-full truncate text-[11px] leading-tight text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('orTypeAndEnter')}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setBarcodeTouched(true); barcodeInputRef.current?.focus() }}
          aria-label={t('manualEntry')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-posCloud-primary-light text-posCloud-primary hover:bg-posCloud-primary/20 transition-colors"
        >
          <Keyboard className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:shrink-0">
        {/* Kept on one line even on mobile per explicit request — three full
            pill buttons genuinely don't fit a 320px screen, so instead of
            wrapping (which broke the row height) this scrolls horizontally.
            -mx-4 px-4 lets the scroll area bleed to the page edge without
            clipping the pill borders/shadows at the edges. */}
        <div className="flex items-center gap-1 flex-nowrap overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3.5 py-1.5 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            <button
              type="button"
              onClick={() => runBarcodeLookup(search, () => setSearch(''))}
              aria-label={t('searchProducts')}
              className="shrink-0 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-primary transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            <input
              ref={searchInputRef}
              placeholder={t('searchProducts')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-20 min-w-0 bg-transparent outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary text-posCloud-text-primary dark:text-posCloudDark-text-primary sm:w-28"
            />
          </div>
          <button
            onClick={handleOpenDrawer}
            disabled={openDrawer.isPending}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3.5 py-1.5 text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary transition-colors hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-60"
          >
            <Archive className="h-4 w-4" />
            {t('openDrawer')}
          </button>
          {onOpenHeldOrders && (
            <button
              onClick={onOpenHeldOrders}
              className="relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3.5 py-1.5 text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <PauseCircle className="h-4 w-4" />
              {t('heldOrders.title')}
              {heldOrdersCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-posCloud-danger px-1 text-xs font-bold text-white">
                  {heldOrdersCount}
                </span>
              )}
            </button>
          )}
          <Link
            href="/dashboard/items?create=1"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-posCloud-primary px-3.5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-posCloud-primary-dark"
          >
            <Plus className="h-4 w-4" />
            {t('newProduct')}
          </Link>
        </div>
      </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-posCloud-primary text-white'
              : 'bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-secondary dark:text-posCloudDark-text-secondary border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          {t('categories.all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-posCloud-primary text-white'
                : 'bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-secondary dark:text-posCloudDark-text-secondary border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid + cart side by side (desktop); stacked on small screens. */}
      <div className="flex flex-row items-start gap-3 min-[480px]:gap-5">
      <div className="min-w-0 flex-1">
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-sm">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(104px,19vw,145px),1fr))] gap-3 pb-2">
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-sm py-10">{t('noItems')}</p>
          )}
          {filtered.slice(0, visibleCount).map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              currency={currency}
              onPick={handleItemClick}
              serviceLabel={t('service')}
              multipleLabel={t('multiple')}
              outOfStockLabel={t('outOfStock')}
            />
          ))}
          {filtered.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="col-span-full rounded-xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface py-3 text-sm font-medium text-posCloud-primary transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
            >
              {t('showMore', { shown: visibleCount, total: filtered.length })}
            </button>
          )}
        </div>
      )}
      </div>
      {aside}
      </div>

      {variantModal && (
        <VariantModal
          item={variantModal}
          onAddItem={onAddItem}
          onClose={() => setVariantModal(null)}
          t={t}
        />
      )}
    </div>
  )
}
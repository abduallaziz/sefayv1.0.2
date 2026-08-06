'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Plus, Package, ChevronDown, Upload, Download, Star,
  CheckCircle2, AlertTriangle, Layers, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { StatCard } from '@/shared/ui/stat-card';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { useInventoryDashboard } from '@/features/inventory-dashboard/hooks/useInventoryDashboard';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown';
import { Pagination } from '@/shared/components/ui/Pagination';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import type { ItemsQuery } from './api/items.api';
import { useItemStats, usePagedItems } from './hooks/useItems';
import { useCategories, useCreateItem, useUpdateItem, useDeleteItem, useCreateVariant, useUpdateVariant, useDeleteVariant } from './hooks/useItems';
import { ItemFiltersBar } from './components/ItemFilters';
import { ItemsTable } from './components/ItemsTable';
import { ItemFormModal } from './components/ItemFormModal';
import { VariantsModal } from './components/VariantsModal';
import { BarcodesModal } from './components/BarcodesModal';
import { DeleteItemModal } from './components/DeleteItemModal';
import { Item, ItemFilters, ItemType, CreateItemDTO } from './types/item.types';

// Every item type the backend accepts (create-item.dto.ts ItemType enum) —
// surfaced in the "New Item" dropdown so the user picks what they're creating
// before the form opens, instead of always landing on 'product'.
const ITEM_TYPES: ItemType[] = [
  'product',
  'service',
  'raw_material',
  'semi_finished',
  'finished_goods',
  'asset',
  'consumable',
  'custom',
];

export function ItemsPage() {
  const t = useTranslations('items');
  const locale = useLocale();
  const currency = useCurrencyDisplay();
  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    type: 'all',
    category_id: 'all',
    is_active: 'all',
  });

  // Server-driven list. Search is debounced so a weak connection sees one
  // request per pause, not one per keystroke.
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  // Page resets must happen *before* the query runs, never in an effect: an
  // effect leaves one render where the new filter pairs with the old page and
  // requests an offset past the end (PGRST103 -> 500). Learned in Migration 1.
  const setPerPage = (next: number) => {
    setPerPageState(next);
    setPage(1);
  };

  const serverQuery: ItemsQuery = {
    search: debouncedSearch.trim() || undefined,
    type: filters.type === 'all' ? undefined : filters.type,
    category_id: filters.category_id === 'all' ? undefined : filters.category_id,
    is_active:
      filters.is_active === 'all' ? 'all' : filters.is_active ? 'true' : 'false',
    page,
    perPage,
  };

  // Any filter change (not just search) invalidates the current page number.
  // Corrected during render so the stale-page request is never issued.
  const filterKey = JSON.stringify([
    serverQuery.search,
    serverQuery.type,
    serverQuery.category_id,
    serverQuery.is_active,
    perPage,
  ]);
  const [filterKeyAtPage, setFilterKeyAtPage] = useState(filterKey);
  let effectivePage = page;
  if (filterKeyAtPage !== filterKey) {
    effectivePage = 1;
    setFilterKeyAtPage(filterKey);
    setPage(1);
  }

  const { data: paged, isLoading, isFetching } = usePagedItems({
    ...serverQuery,
    page: effectivePage,
  });

  const items = paged?.data ?? [];
  const total = paged?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const { data: stats } = useItemStats();
  const { data: inventory } = useInventoryDashboard();

  // Always 'en-US' so digits stay Western (0-9) in every locale — project rule.
  const fmtCount = (n?: number) =>
    n === undefined ? '—' : n.toLocaleString('en-US');
  // Currency rides along with the amount ("22,000.00 SAR") — it is one fact,
  // not two, so it must never be split onto the supporting line.
  const fmtMoney = (n?: number, unit?: string) =>
    n === undefined
      ? '—'
      : `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
  // Share of the tenant's total item count. Undefined stats (or a zero total,
  // i.e. a brand-new tenant) render nothing rather than a misleading "0%".
  const pctOfTotal = (n?: number) =>
    n === undefined || !stats?.total
      ? undefined
      : t('kpiOfTotal', { percent: Math.round((n / stats.total) * 100) });
  const { data: categories = [] } = useCategories();

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [formOpen, setFormOpen] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [barcodesOpen, setBarcodesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  // Type chosen from the "New Item" dropdown, pre-selected in the create form.
  const [newItemType, setNewItemType] = useState<ItemType>('product');

  // Lets other pages (e.g. the POS "New Product" toolbar button) jump
  // straight into item creation via /items?create=1, without needing any
  // shared modal-open state across routes.
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('create') === '1') setFormOpen(true);
  }, [searchParams]);

  // Search / type / category / status are all applied by the server now —
  // filtering here would only ever filter the current page, which is what
  // capped this table at one page of results.

  const handleSubmit = (data: CreateItemDTO) => {
    if (selectedItem) {
      updateItem.mutate(
        { id: selectedItem.id, data },
        { onSuccess: () => { setFormOpen(false); setSelectedItem(null); } }
      );
    } else {
      createItem.mutate(data, {
        onSuccess: (newItem: any) => {
          setFormOpen(false);
          // Variants are managed exclusively from VariantsModal (single
          // source of truth) — jump straight there when the item was created
          // with "has variants" checked instead of building variants inline.
          if (data.has_variants) {
            setSelectedItem(newItem);
            setVariantsOpen(true);
          }
        }
      });
    }
  };

  const handleCreateNew = (type: ItemType) => {
    setSelectedItem(null);
    setNewItemType(type);
    setFormOpen(true);
  };

  const handleToggleActive = (item: Item) => {
    updateItem.mutate({ id: item.id, data: { is_active: !item.is_active } });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    deleteItem.mutate(selectedItem.id, {
      onSuccess: () => { setDeleteOpen(false); setSelectedItem(null); }
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        breadcrumb={[{ label: t('home') }, { label: t('title') }]}
        breadcrumbPosition="belowTitle"
        actionsAlign="center"
        actionsGap="wide"
        className="pt-1 pb-6"
        title={t('title')}
        titleAdornment={
          <span title={t('comingSoon')} className="ms-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              disabled
              aria-label={t('addToFavorites')}
              className="h-8 w-8"
            >
              <Star className="w-4 h-4" />
            </Button>
          </span>
        }
        actions={
          <>
            {/* Reference-design actions with no backend yet (import/export/bulk)
                are rendered disabled rather than omitted, so the header matches
                the approved visual. The span wrapper is required — a disabled
                button swallows the pointer events a native title tooltip needs. */}
            <span title={t('comingSoon')}>
              <Button variant="outline" disabled className="px-5">
                <Plus className="w-4 h-4" />
                {t('bulkActions')}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </span>
            <span title={t('comingSoon')}>
              <Button variant="outline" disabled className="px-5">
                <Download className="w-4 h-4" />
                {t('export')}
              </Button>
            </span>
            <span title={t('comingSoon')}>
              <Button variant="outline" disabled className="px-5">
                <Upload className="w-4 h-4" />
                {t('import')}
              </Button>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="px-5">
                  <Plus className="w-4 h-4" />
                  {t('newItem')}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('itemType')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ITEM_TYPES.map((type) => (
                  <DropdownMenuItem key={type} onClick={() => handleCreateNew(type)}>
                    {t(type)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* KPI cards. Counts come from GET /items/stats (tenant-wide) — never
          from `items.length`, which is one page of a paginated list. Stock
          figures come from the inventory analytics summary, the same source
          the Inventory dashboard reads, so the two never disagree. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title={t('kpiTotal')}
          value={fmtCount(stats?.total)}
          sub={t('kpiTotalSub')}
          icon={Package}
          variant="default"
        />
        <StatCard
          title={t('kpiActive')}
          value={fmtCount(stats?.active)}
          sub={pctOfTotal(stats?.active)}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title={t('kpiNeedReorder')}
          value={fmtCount(inventory?.summary.low_stock_items)}
          sub={
            <Link
              href={`/${locale}/dashboard/inventory`}
              className="text-posCloud-primary hover:underline"
            >
              {t('kpiNeedReorderAction')}
            </Link>
          }
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title={t('kpiWithVariants')}
          value={fmtCount(stats?.withVariants)}
          sub={pctOfTotal(stats?.withVariants)}
          icon={Layers}
          variant="info"
        />
        <StatCard
          title={t('kpiInventoryValue')}
          value={fmtMoney(inventory?.summary.inventory_value, currency)}
          icon={Wallet}
          variant="default"
        />
      </div>

      <ItemFiltersBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
        onBarcodeFound={(item) => { setSelectedItem(item); setFormOpen(true); }}
      />

      {isLoading ? (
        <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('loading')}</div>
      ) : (
        <ItemsTable
          items={items}
          onEdit={(item) => { setSelectedItem(item); setFormOpen(true); }}
          onDelete={(item) => { setSelectedItem(item); setDeleteOpen(true); }}
          onVariants={(item) => { setSelectedItem(item); setVariantsOpen(true); }}
          onBarcodes={(item) => { setSelectedItem(item); setBarcodesOpen(true); }}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* `total` is the server's count across every page, not the page length. */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <span>{t('countLabel', { count: total })}</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            aria-label={t('rowsPerPage')}
            className="bg-transparent border border-posCloud-border dark:border-posCloudDark-border rounded-md px-2 py-1 text-xs tabular-nums focus:outline-none focus:border-posCloud-primary"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {isFetching && <span>{t('loading')}</span>}
        </div>
        {totalPages > 1 && (
          <Pagination page={effectivePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>

      <ItemFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedItem(null); }}
        onSubmit={handleSubmit}
        item={selectedItem}
        defaultType={newItemType}
        categories={categories}
        isLoading={createItem.isPending || updateItem.isPending}
      />
      <VariantsModal
        open={variantsOpen}
        onClose={() => { setVariantsOpen(false); setSelectedItem(null); }}
        item={selectedItem}
        onAddVariant={(itemId, data) =>
          createVariant.mutate(
            { itemId, data },
            { onError: (error: any) => toast.error(error?.message ?? 'Failed to add variant') },
          )
        }
        onUpdateVariant={(itemId, variantId, data) =>
          updateVariant.mutate(
            { itemId, variantId, data },
            { onError: (error: any) => toast.error(error?.message ?? 'Failed to update variant') },
          )
        }
        onDeleteVariant={(itemId, variantId) =>
          deleteVariant.mutate(
            { itemId, variantId },
            { onError: (error: any) => toast.error(error?.message ?? 'Failed to delete variant') },
          )
        }
      />
      <BarcodesModal
        open={barcodesOpen}
        onClose={() => { setBarcodesOpen(false); setSelectedItem(null); }}
        item={selectedItem}
      />
      <DeleteItemModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedItem(null); }}
        onConfirm={handleDelete}
        item={selectedItem}
        isLoading={deleteItem.isPending}
      />
    </div>
  );
}
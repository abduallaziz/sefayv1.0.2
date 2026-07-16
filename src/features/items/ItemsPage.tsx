'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useItems, useCategories, useCreateItem, useUpdateItem, useDeleteItem, useDeleteVariant } from './hooks/useItems';
import { itemsApi } from './api/items.api';
import { ItemFiltersBar } from './components/ItemFilters';
import { ItemsTable } from './components/ItemsTable';
import { ItemFormModal } from './components/ItemFormModal';
import { VariantsModal } from './components/VariantsModal';
import { DeleteItemModal } from './components/DeleteItemModal';
import { Item, ItemFilters, CreateItemDTO } from './types/item.types';

export function ItemsPage() {
  const t = useTranslations('items');
  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useCategories();

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const deleteVariant = useDeleteVariant();

  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    type: 'all',
    category_id: 'all',
    is_active: 'all',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.category_id !== 'all' && item.category_id !== filters.category_id) return false;
      if (filters.is_active !== 'all' && item.is_active !== filters.is_active) return false;
      return true;
    });
  }, [items, filters]);

  const handleSubmit = async (
    data: CreateItemDTO,
    variants?: { name: string; price_adjustment: number; sku: string }[]
  ) => {
    if (selectedItem) {
      updateItem.mutate(
        { id: selectedItem.id, data },
        { onSuccess: () => { setFormOpen(false); setSelectedItem(null); } }
      );
    } else {
      createItem.mutate(data, {
        onSuccess: async (newItem: any) => {
          if (variants && variants.length > 0) {
            await Promise.allSettled(variants.map(v => itemsApi.createVariant(newItem.id, v)));
          }
          setFormOpen(false);
        }
      });
    }
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

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            {items.length} {t('totalItems')} • {activeCount} {t('active')}
          </p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" />
          {t('addItem')}
        </Button>
      </div>

      {/* Total Products — the only stat pos-cloud shows that Sefay's frontend
          can compute from already-loaded data (see F2 Content/Data Gap note:
          Low Stock / Out of Stock / Total Value need stock_quantity, which
          only exists per-variant via a separate lazy-loaded endpoint, never
          in the bulk items list). */}
      <div className="flex items-center gap-3 rounded-2xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface p-4 w-fit">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-posCloud-primary-light dark:bg-posCloud-primary/15">
          <Package className="h-5 w-5 text-posCloud-primary" />
        </div>
        <div>
          <p className="text-xs font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('totalItems')}</p>
          <p className="text-xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{items.length}</p>
        </div>
      </div>

      <ItemFiltersBar filters={filters} onChange={setFilters} categories={categories} />

      {isLoading ? (
        <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('loading')}</div>
      ) : (
        <ItemsTable
          items={filtered}
          onEdit={(item) => { setSelectedItem(item); setFormOpen(true); }}
          onDelete={(item) => { setSelectedItem(item); setDeleteOpen(true); }}
          onVariants={(item) => { setSelectedItem(item); setVariantsOpen(true); }}
          onToggleActive={handleToggleActive}
        />
      )}

      <ItemFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedItem(null); }}
        onSubmit={handleSubmit}
        item={selectedItem}
        categories={categories}
        isLoading={createItem.isPending || updateItem.isPending}
      />
      <VariantsModal
        open={variantsOpen}
        onClose={() => { setVariantsOpen(false); setSelectedItem(null); }}
        item={selectedItem}
        onAddVariant={(itemId, data) => itemsApi.createVariant(itemId, data)}
        onDeleteVariant={(itemId, variantId) => deleteVariant.mutate({ itemId, variantId })}
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
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} {t('totalItems')} • {activeCount} {t('active')}
          </p>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addItem')}
        </button>
      </div>

      <ItemFiltersBar filters={filters} onChange={setFilters} categories={categories} />

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
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
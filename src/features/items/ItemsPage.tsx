
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useItems, useCategories, useCreateItem, useUpdateItem, useDeleteItem, useCreateVariant, useDeleteVariant } from './hooks/useItems';
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
  const createVariant = useCreateVariant();
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

  const handleSubmit = (data: CreateItemDTO) => {
    if (selectedItem) {
      updateItem.mutate({ id: selectedItem.id, data }, { onSuccess: () => { setFormOpen(false); setSelectedItem(null); } });
    } else {
      createItem.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleToggleActive = (item: Item) => {
    updateItem.mutate({ id: item.id, data: { is_active: !item.is_active } });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    deleteItem.mutate(selectedItem.id, { onSuccess: () => { setDeleteOpen(false); setSelectedItem(null); } });
  };

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} {t('totalItems')} • {activeCount} {t('active')}
          </p>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t('addItem')}
        </button>
      </div>

      {/* Filters */}
      <ItemFiltersBar filters={filters} onChange={setFilters} categories={categories} />

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{t('loading')}</div>
      ) : (
        <ItemsTable
          items={filtered}
          onEdit={(item) => { setSelectedItem(item); setFormOpen(true); }}
          onDelete={(item) => { setSelectedItem(item); setDeleteOpen(true); }}
          onVariants={(item) => { setSelectedItem(item); setVariantsOpen(true); }}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Modals */}
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
        onAddVariant={(itemId, data) => createVariant.mutate({ itemId, data })}
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
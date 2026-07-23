'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Search, Barcode } from 'lucide-react';
import type { ItemFilters, ItemType, Category, Item } from '../types/item.types';
import { itemsApi } from '../api/items.api';

interface Props {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
  categories: Category[];
  onBarcodeFound?: (item: Item) => void;
}

export function ItemFiltersBar({ filters, onChange, categories, onBarcodeFound }: Props) {
  const t = useTranslations('items');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleBarcodeSearch = async () => {
    const code = barcodeQuery.trim();
    if (!code) return;
    setIsScanning(true);
    try {
      const result = await itemsApi.lookupBarcode(code);
      if (result.items) {
        onBarcodeFound?.(result.items as unknown as Item);
        setBarcodeQuery('');
      }
    } catch {
      toast.error(t('barcodeNotFound'));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 flex-1 min-w-[200px]">
        <Search className="w-4 h-4 shrink-0 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-transparent text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 min-w-[180px]">
        <Barcode className="w-4 h-4 shrink-0 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
        <input
          type="text"
          placeholder={t('scanBarcodePlaceholder')}
          value={barcodeQuery}
          onChange={(e) => setBarcodeQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeSearch(); } }}
          disabled={isScanning}
          className="w-full bg-transparent text-sm font-mono text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
        />
      </div>

      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value as ItemType | 'all' })}
        className="px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-lg focus:outline-none focus:border-posCloud-primary text-posCloud-text-primary dark:text-posCloudDark-text-primary"
      >
        <option value="all">{t('allTypes')}</option>
        <option value="product">{t('product')}</option>
        <option value="service">{t('service')}</option>
        <option value="custom">{t('custom')}</option>
        <option value="raw_material">{t('raw_material')}</option>
        <option value="semi_finished">{t('semi_finished')}</option>
        <option value="finished_goods">{t('finished_goods')}</option>
        <option value="asset">{t('asset')}</option>
        <option value="consumable">{t('consumable')}</option>
      </select>

      <select
        value={filters.category_id}
        onChange={(e) => onChange({ ...filters, category_id: e.target.value })}
        className="px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-lg focus:outline-none focus:border-posCloud-primary text-posCloud-text-primary dark:text-posCloudDark-text-primary"
      >
        <option value="all">{t('allCategories')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={String(filters.is_active)}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ ...filters, is_active: val === 'all' ? 'all' : val === 'true' });
        }}
        className="px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-lg focus:outline-none focus:border-posCloud-primary text-posCloud-text-primary dark:text-posCloudDark-text-primary"
      >
        <option value="all">{t('allStatus')}</option>
        <option value="true">{t('active')}</option>
        <option value="false">{t('inactive')}</option>
      </select>
    </div>
  );
}
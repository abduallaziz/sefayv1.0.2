'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StockSection } from './components/StockSection';
import { MovementsSection } from './components/MovementsSection';
import { WarehousesSection } from './components/WarehousesSection';
import { SuppliersSection } from './components/SuppliersSection';
import { PurchaseOrdersSection } from './components/PurchaseOrdersSection';

type TabKey = 'stock' | 'movements' | 'warehouses' | 'suppliers' | 'purchaseOrders';

export function InventoryPage() {
  const t = useTranslations('inventory');
  const [tab, setTab] = useState<TabKey>('stock');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'stock', label: t('tabs.stock') },
    { key: 'movements', label: t('tabs.movements') },
    { key: 'warehouses', label: t('tabs.warehouses') },
    { key: 'suppliers', label: t('tabs.suppliers') },
    { key: 'purchaseOrders', label: t('tabs.purchaseOrders') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-gray-800">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tabItem.key
                ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5] dark:border-[#5B9BD5]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && <StockSection />}
      {tab === 'movements' && <MovementsSection />}
      {tab === 'warehouses' && <WarehousesSection />}
      {tab === 'suppliers' && <SuppliersSection />}
      {tab === 'purchaseOrders' && <PurchaseOrdersSection />}
    </div>
  );
}

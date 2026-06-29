// src/app/[locale]/dashboard/stock-counts/[id]/page.tsx

import { StockCountDetailPage } from '@/features/stock-counts/pages/StockCountDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StockCountDetailPage id={id} />;
}

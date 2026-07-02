// src/app/[locale]/dashboard/goods-receipts/[id]/page.tsx

import { GoodsReceiptDetailPage } from '@/features/goods-receipts/pages/GoodsReceiptDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GoodsReceiptDetailPage id={id} />;
}

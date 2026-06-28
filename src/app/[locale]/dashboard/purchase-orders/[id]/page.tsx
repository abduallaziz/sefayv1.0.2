// src/app/[locale]/dashboard/purchase-orders/[id]/page.tsx

import { PurchaseOrderDetailPage } from '@/features/purchase-orders/pages/PurchaseOrderDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PurchaseOrderDetailPage id={id} />;
}

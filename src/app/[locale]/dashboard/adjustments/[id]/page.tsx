// src/app/[locale]/dashboard/adjustments/[id]/page.tsx

import { AdjustmentDetailPage } from '@/features/adjustments/pages/AdjustmentDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdjustmentDetailPage id={id} />;
}

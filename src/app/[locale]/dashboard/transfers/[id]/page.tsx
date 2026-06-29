// src/app/[locale]/dashboard/transfers/[id]/page.tsx

import { TransferDetailPage } from '@/features/transfers/pages/TransferDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransferDetailPage id={id} />;
}

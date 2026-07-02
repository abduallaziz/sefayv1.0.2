// src/app/[locale]/dashboard/suppliers/[id]/page.tsx

import { SupplierDetailPage } from '@/features/suppliers/pages/SupplierDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierDetailPage id={id} />;
}

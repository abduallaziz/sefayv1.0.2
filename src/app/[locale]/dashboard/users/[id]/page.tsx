// src/app/[locale]/dashboard/users/[id]/page.tsx

import { EmployeeDetailPage } from '@/features/users/pages/EmployeeDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetailPage userId={id} />;
}

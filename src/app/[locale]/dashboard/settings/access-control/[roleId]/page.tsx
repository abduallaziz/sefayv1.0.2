// src/app/[locale]/dashboard/settings/access-control/[roleId]/page.tsx

import { RolePermissionsPage } from '@/features/access-control/pages/RolePermissionsPage';

export default async function Page({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <RolePermissionsPage roleId={roleId} />;
}

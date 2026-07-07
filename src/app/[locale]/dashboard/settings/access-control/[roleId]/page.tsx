// src/app/[locale]/dashboard/settings/access-control/[roleId]/page.tsx

import { AccessControlPage } from '@/features/access-control/pages/AccessControlPage';

export default async function Page({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <AccessControlPage initialRoleId={roleId} />;
}

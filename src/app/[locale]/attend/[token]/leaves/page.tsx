import { AttendLeavesPage } from '@/features/attend/pages/AttendLeavesPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AttendLeavesPage token={token} />;
}

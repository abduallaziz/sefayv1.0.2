import { AttendLogPage } from '@/features/attend/pages/AttendLogPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AttendLogPage token={token} />;
}

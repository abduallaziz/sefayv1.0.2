import { AttendMorePage } from '@/features/attend/pages/AttendMorePage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AttendMorePage token={token} />;
}

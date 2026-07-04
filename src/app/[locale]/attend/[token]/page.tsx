import { AttendPage } from '@/features/attend/pages/AttendPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AttendPage token={token} />;
}

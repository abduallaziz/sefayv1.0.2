'use client';
import dynamic from 'next/dynamic';
const SchedulesPage = dynamic(() =>
  import('@/features/hr/pages/SchedulesPage').then((m) => m.SchedulesPage)
);
export default function Page() {
  return <SchedulesPage />;
}

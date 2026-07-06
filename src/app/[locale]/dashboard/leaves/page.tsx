'use client';
import dynamic from 'next/dynamic';
const LeavesPage = dynamic(() =>
  import('@/features/hr/pages/LeavesPage').then((m) => m.LeavesPage)
);
export default function Page() {
  return <LeavesPage />;
}

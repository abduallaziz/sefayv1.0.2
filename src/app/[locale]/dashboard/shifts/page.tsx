'use client';
import dynamic from 'next/dynamic';
const ShiftsPage = dynamic(() =>
  import('@/features/shifts/pages/ShiftsPage').then((m) => m.ShiftsPage)
);
export default function Page() {
  return <ShiftsPage />;
}
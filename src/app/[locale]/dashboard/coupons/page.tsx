'use client';
import dynamic from 'next/dynamic';
const CouponsPage = dynamic(() =>
  import('@/features/coupons/pages/CouponsPage').then((m) => m.CouponsPage)
);
export default function Page() {
  return <CouponsPage />;
}

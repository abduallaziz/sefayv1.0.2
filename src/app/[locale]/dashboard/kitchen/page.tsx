'use client';
import dynamic from 'next/dynamic';
const KitchenPage = dynamic(() =>
  import('@/features/kitchen/pages/KitchenPage').then((m) => m.KitchenPage)
);
export default function Page() {
  return <KitchenPage />;
}

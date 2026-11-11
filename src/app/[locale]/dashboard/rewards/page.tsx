'use client';
import dynamic from 'next/dynamic';
const RewardsPage = dynamic(() =>
  import('@/features/rewards/pages/RewardsPage').then((m) => m.RewardsPage)
);
export default function Page() {
  return <RewardsPage />;
}

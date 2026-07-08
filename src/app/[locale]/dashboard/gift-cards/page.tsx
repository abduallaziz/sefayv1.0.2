'use client';
import dynamic from 'next/dynamic';
const GiftCardsPage = dynamic(() =>
  import('@/features/gift-cards/pages/GiftCardsPage').then((m) => m.GiftCardsPage)
);
export default function Page() {
  return <GiftCardsPage />;
}

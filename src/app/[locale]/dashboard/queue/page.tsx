'use client';
import dynamic from 'next/dynamic';
const QueuePage = dynamic(() =>
  import('@/features/queue/pages/QueuePage').then((m) => m.QueuePage)
);
export default function Page() {
  return <QueuePage />;
}

'use client';
import dynamic from 'next/dynamic';
const TablesPage = dynamic(() =>
  import('@/features/tables/pages/TablesPage').then((m) => m.TablesPage)
);
export default function Page() {
  return <TablesPage />;
}

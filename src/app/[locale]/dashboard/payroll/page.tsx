'use client';
import dynamic from 'next/dynamic';
const PayrollReportPage = dynamic(() =>
  import('@/features/reports/pages/PayrollReportPage').then((m) => m.PayrollReportPage)
);
export default function Page() {
  return <PayrollReportPage />;
}

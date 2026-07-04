'use client';
import dynamic from 'next/dynamic';
const AttendancePage = dynamic(() =>
  import('@/features/hr/pages/AttendancePage').then((m) => m.AttendancePage)
);
export default function Page() {
  return <AttendancePage />;
}

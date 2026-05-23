import { MainLayout } from '@/shared/layout/main-layout'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
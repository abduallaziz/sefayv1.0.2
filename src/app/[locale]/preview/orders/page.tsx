import { OrdersPage } from '@/features/orders/pages/OrdersPage'

// Isolated preview route — same OrdersPage component, no DashboardLayout
// (Sidebar/Header) wrapper. Kept out of /dashboard on purpose: that layout
// is shared by every dashboard route, so bypassing it here (rather than
// editing the shared layout) avoids removing navigation chrome site-wide.
export default function OrdersPreviewPage() {
  return (
    <div className="min-h-screen bg-white p-4 lg:p-6">
      <OrdersPage />
    </div>
  )
}

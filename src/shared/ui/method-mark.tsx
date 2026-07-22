import { Banknote, Wallet as WalletIcon, Gift } from 'lucide-react'
import Image from 'next/image'

export type MethodMarkId =
  | 'cash' | 'card' | 'split' | 'wallet' | 'mada' | 'visa'
  | 'mastercard' | 'stc_pay' | 'apple_pay' | 'tab' | 'gift_card'

// Real brand logo files (public/payment-methods/*.svg, downloaded from
// Wikimedia Commons per explicit user-provided URLs) — used for nominative
// identification of supported payment networks, the same way any POS/
// checkout UI displays the card-network logos it accepts.
const LOGO_SRC: Partial<Record<MethodMarkId, string>> = {
  mada: '/payment-methods/mada.svg',
  visa: '/payment-methods/visa.svg',
  mastercard: '/payment-methods/mastercard.svg',
  apple_pay: '/payment-methods/apple-pay.svg',
  stc_pay: '/payment-methods/stc-pay.svg',
}

// Shared between PaymentModal (POS), OrderDetailsModal/OrdersTable (Orders),
// and DashboardOverview's payment-method breakdown so all surfaces render
// payment methods identically. `className` overrides the logo's default
// size (h-5 w-12) for tighter contexts like the dashboard's icon chips.
export function MethodMark({ id, className }: { id: MethodMarkId; className?: string }) {
  const logoSrc = LOGO_SRC[id]
  if (logoSrc) {
    return (
      <span dir="ltr" className={`relative inline-block ${className ?? 'h-5 w-12'}`}>
        <Image src={logoSrc} alt={id} fill className="object-contain" unoptimized />
      </span>
    )
  }

  switch (id) {
    case 'cash':
      return <Banknote className="h-5 w-5" />
    case 'wallet':
      return <WalletIcon className="h-5 w-5" />
    case 'split':
      return (
        <span dir="ltr" className="flex items-center gap-0.5">
          <Banknote className="h-4 w-4" />
          <span className="text-xs font-bold">+</span>
          <span className="h-4 w-5 rounded-sm border-2 border-current" />
        </span>
      )
    case 'gift_card':
      return <Gift className="h-5 w-5" />
    case 'card':
    case 'tab':
      return <Banknote className="h-5 w-5" />
    default:
      return null
  }
}

import { Banknote, Wallet as WalletIcon, Apple, Gift } from 'lucide-react'

export type MethodMarkId =
  | 'cash' | 'card' | 'split' | 'wallet' | 'mada' | 'visa'
  | 'mastercard' | 'stc_pay' | 'apple_pay' | 'tab' | 'gift_card'

// Brand-styled marks (not official trademarked logo files — recognizable
// approximations built from CSS/wordmarks/lucide icons) rather than a single
// generic card icon for every network, per explicit user request to make
// each method visually distinguishable like a real POS terminal.
// Shared between PaymentModal (POS) and OrderDetailsModal (Orders) so both
// surfaces render payment methods identically.
export function MethodMark({ id }: { id: MethodMarkId }) {
  switch (id) {
    case 'cash':
      return <Banknote className="h-5 w-5" />
    case 'mada':
      return (
        <span dir="ltr" className="flex h-5 items-center gap-[1px] text-[13px] font-black italic tracking-tighter">
          <span className="text-[#00847E]">m</span>
          <span className="text-[#54B948]">a</span>
          <span className="text-[#00847E]">d</span>
          <span className="text-[#54B948]">a</span>
        </span>
      )
    case 'visa':
      return <span dir="ltr" className="text-[15px] font-black italic tracking-tighter text-[#1A1F71]">VISA</span>
    case 'mastercard':
      return (
        <span dir="ltr" className="flex h-5 items-center">
          <span className="h-4 w-4 rounded-full bg-[#EB001B]" />
          <span className="-ms-1.5 h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
        </span>
      )
    case 'apple_pay':
      return (
        <span dir="ltr" className="flex items-center gap-0.5">
          <Apple className="h-4 w-4 fill-current" />
          <span className="text-[13px] font-semibold">Pay</span>
        </span>
      )
    case 'stc_pay':
      return (
        <span dir="ltr" className="text-[12px] font-black tracking-tight">
          <span className="text-[#4B0F73]">STC</span>{' '}
          <span className="italic text-[#84BD00]">pay</span>
        </span>
      )
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

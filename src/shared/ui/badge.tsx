import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#6366f1]/20 text-[#818cf8]',
        success: 'bg-[#22c55e]/20 text-[#22c55e]',
        warning: 'bg-[#f59e0b]/20 text-[#f59e0b]',
        danger: 'bg-[#ef4444]/20 text-[#ef4444]',
        muted: 'bg-[#1e2130] text-[#64748b]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      // Matrix D1: variant/size prop API unchanged (same keys as before) —
      // only the underlying color classes were restyled to the posCloud
      // tokens staged in A1/A3. No consumer of <Button variant=... size=.../>
      // needs to change.
      variant: {
        default: 'bg-posCloud-primary text-white hover:bg-posCloud-primary-dark shadow-sm shadow-posCloud-primary/20',
        destructive: 'bg-posCloud-danger text-white hover:brightness-95',
        outline: 'border border-posCloud-border dark:border-posCloudDark-border bg-transparent text-posCloud-text-secondary dark:text-white hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40',
        ghost: 'text-posCloud-text-secondary dark:text-white hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40',
        success: 'bg-posCloud-success text-white hover:brightness-95',
        warning: 'bg-posCloud-warning text-white hover:brightness-95',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
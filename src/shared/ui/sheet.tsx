'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

// Tailwind's animate plugin only knows physical directions
// (slide-in-from-left/right) — there's no logical "slide-in-from-end"
// utility, so the physical CSS has to be resolved once, here, from the
// logical prop callers actually use (`start`/`end`). Positioning/border use
// Tailwind's logical utilities (`start-0`/`end-0`, `border-s`/`border-e`),
// which flip automatically with `dir` — only the animation direction name
// needs the manual locale check below.
const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-0 bg-white dark:bg-[#1a1f2e] shadow-xl transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
  {
    variants: {
      side: {
        start: 'inset-y-0 start-0 h-full w-full border-e border-slate-200 dark:border-[#1e2130] sm:max-w-xl',
        end: 'inset-y-0 end-0 h-full w-full border-s border-slate-200 dark:border-[#1e2130] sm:max-w-xl',
      },
    },
    defaultVariants: { side: 'end' },
  }
)

interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

function SheetContent({ side = 'end', className, children, ...props }: SheetContentProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  // logical side -> physical animation direction, resolved per locale.
  const physicallyOpensFromRight = isRtl ? side === 'start' : side === 'end'
  const animationClass = physicallyOpensFromRight
    ? 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
    : 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left'

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content className={cn(sheetVariants({ side }), animationClass, className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute end-4 top-4 rounded opacity-70 text-slate-500 dark:text-[#64748b] transition-opacity hover:opacity-100 focus:outline-none">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-6 border-b border-slate-200 dark:border-[#1e2130]', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-slate-900 dark:text-white tracking-tight', className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-slate-500', className)} {...props} />
}

function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto p-6 pb-24', className)} {...props} />
}

// Sticky footer per spec: absolute-positioned within the flex column content,
// not the viewport — SheetContent is the positioning ancestor.
function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'absolute bottom-0 inset-x-0 flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#161B22]',
        className
      )}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter }

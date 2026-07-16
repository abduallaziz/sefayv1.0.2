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
// `top-0`/`bottom-0` are split out instead of using `inset-y-0` so a caller
// can cleanly override just the top offset (e.g. to clear a sticky app
// header) via className — tailwind-merge only resolves same-utility
// conflicts, and `top-[66px]` vs `inset-y-0` isn't reliably one of those.
// No explicit height utility: with `position: fixed` and both `top` and
// `bottom` set, height is auto-computed to exactly fill the gap between them
// — adding `h-full` here would fight that (height:100% ignores the bottom
// offset) and overflow past the viewport whenever top is non-zero.
const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-0 bg-posCloud-surface dark:bg-posCloudDark-surface shadow-xl transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
  {
    variants: {
      side: {
        start: 'top-0 bottom-0 start-0 w-full border-e border-posCloud-border dark:border-posCloudDark-border sm:max-w-xl',
        end: 'top-0 bottom-0 end-0 w-full border-s border-posCloud-border dark:border-posCloudDark-border sm:max-w-xl',
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
        <DialogPrimitive.Close className="absolute end-4 top-4 rounded opacity-70 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary transition-opacity hover:opacity-100 focus:outline-none">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-6 border-b border-posCloud-border dark:border-posCloudDark-border', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary tracking-tight', className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary', className)} {...props} />
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
        'absolute bottom-0 inset-x-0 flex items-center justify-end gap-3 p-4 border-t border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background',
        className
      )}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter }

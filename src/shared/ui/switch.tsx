'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

// Matrix D4: classes only, same Root/Thumb structure and prop passthrough
// (React.ComponentProps<typeof SwitchPrimitive.Root>) — no new props.
// Real behavior fix included per the Matrix's own flagged dependency: the
// prior thumb used translate-x-5/translate-x-0, a physical (direction-
// agnostic) transform, even though this app is RTL-aware (Arabic sets
// dir="rtl" on <html>). Replaced with pos-cloud's rtl:/ltr: + absolute
// left-position technique so "checked" lands on the correct side per
// writing direction instead of sliding the same physical direction in
// both languages.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-posCloud-primary data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-white/15',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left]',
          'rtl:left-[22px] rtl:data-[state=checked]:left-0.5',
          'ltr:left-0.5 ltr:data-[state=checked]:left-[22px]'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
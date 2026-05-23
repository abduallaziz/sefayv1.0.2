'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <AvatarPrimitive.Image
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-[#242938] text-sm font-medium text-white',
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
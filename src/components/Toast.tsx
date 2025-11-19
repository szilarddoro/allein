import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'
import { useDebounceValue } from 'usehooks-ts'

export interface ToastProps {
  visible?: boolean
  hideDelay?: number
  className?: string
}

export function Toast({
  visible,
  hideDelay = 250,
  className,
  children,
}: PropsWithChildren<ToastProps>) {
  const [preventRender] = useDebounceValue(!visible, hideDelay)

  if (preventRender) {
    return null
  }

  return (
    <div
      className={cn(
        'bg-neutral-200/20 dark:bg-neutral-800/20 backdrop-blur-xl border border-border rounded-md pl-3 pr-1.5 py-2 motion-safe:transition-opacity text-sm flex items-center justify-between gap-12 shadow-xs min-h-12.5',
        !visible ? 'pointer-events-none opacity-0' : 'opacity-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

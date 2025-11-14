import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PropsWithChildren, RefObject } from 'react'

export interface BrowserCardProps {
  ref?:
    | RefObject<HTMLDivElement | null>
    | ((element: HTMLElement | null) => void)
  className?: string
}

export function BrowserCard({
  ref,
  className,
  children,
}: PropsWithChildren<BrowserCardProps>) {
  return (
    <Card
      ref={ref}
      className={cn(
        'rounded-md aspect-[5/6] px-3 py-2 pb-0 overflow-hidden gap-0 relative bg-card dark:bg-card/80',
        'before:z-20 before:absolute before:rounded-md before:top-0 before:left-0 before:size-full before:border before:border-transparent group-hover:before:bg-blue-500/5 group-focus:before:bg-blue-500/5 before:motion-safe:transition-colors',
        className,
      )}
    >
      {children}
    </Card>
  )
}

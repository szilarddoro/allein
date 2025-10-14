import { useInvalidateQueriesOnWindowFocus } from '@/hooks/useInvalidateQueriesOnWindowFocus'
import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'
export interface BaseLayoutProps extends PropsWithChildren {
  className?: string
}

export function BaseLayout({ className, children }: BaseLayoutProps) {
  useInvalidateQueriesOnWindowFocus()

  return (
    <div
      className={cn(
        'relative h-screen flex flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-900/70 overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

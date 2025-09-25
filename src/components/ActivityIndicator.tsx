import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PropsWithChildren } from 'react'

export interface ActivityIndicatorProps extends PropsWithChildren {
  srOnly?: boolean
  className?: string
}

export function ActivityIndicator({
  children = 'Loading...',
  className,
  srOnly,
}: ActivityIndicatorProps) {
  return (
    <div
      className={cn(
        'flex gap-1 items-center text-sm text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className={cn(srOnly && 'sr-only')}>{children}</span>
    </div>
  )
}

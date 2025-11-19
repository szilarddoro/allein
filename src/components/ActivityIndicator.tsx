import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface ActivityIndicatorProps extends PropsWithChildren {
  srOnly?: boolean
  className?: string
  iconClassName?: string
}

export function ActivityIndicator({
  children = 'Loading...',
  className,
  iconClassName,
  srOnly,
}: ActivityIndicatorProps) {
  const id = `activity-indicator-${uuidv4()}`

  return (
    <span
      role="status"
      className={cn(
        'flex gap-1 items-center text-sm text-muted-foreground',
        className,
      )}
      aria-labelledby={id}
    >
      <Loader2 className={cn('size-4 animate-spin', iconClassName)} />
      <span id={id} className={cn(srOnly && 'sr-only')}>
        {children}
      </span>
    </span>
  )
}

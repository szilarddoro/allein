import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface ActivityIndicatorProps extends PropsWithChildren {
  srOnly?: boolean
  className?: string
}

export function ActivityIndicator({
  children = 'Loading...',
  className,
  srOnly,
}: ActivityIndicatorProps) {
  const id = `activity-indicator-${uuidv4()}`

  return (
    <div
      role="progressbar"
      className={cn(
        'flex gap-1 items-center text-sm/tight text-muted-foreground',
        className,
      )}
      aria-labelledby={id}
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span id={id} className={cn(srOnly && 'sr-only')}>
        {children}
      </span>
    </div>
  )
}

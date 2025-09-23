import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PropsWithChildren } from 'react'

export interface ActivityIndicatorProps extends PropsWithChildren {
  srOnly?: boolean
}

export function ActivityIndicator({
  children = 'Loading...',
  srOnly,
}: ActivityIndicatorProps) {
  return (
    <div className="flex gap-1 items-center text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className={cn(srOnly && 'sr-only')}>{children}</span>
    </div>
  )
}

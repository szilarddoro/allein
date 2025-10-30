import {
  ActivityIndicator,
  ActivityIndicatorProps,
} from '@/components/ActivityIndicator'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useTimeout } from 'usehooks-ts'

export interface DelayedActivityIndicatorProps extends ActivityIndicatorProps {
  delay?: number
  disableMountWhileDelayed?: boolean
}

export function DelayedActivityIndicator({
  delay = 350,
  disableMountWhileDelayed,
  ...props
}: DelayedActivityIndicatorProps) {
  const [showActivityIndicator, setShowActivityIndicator] = useState(false)

  useTimeout(() => {
    setShowActivityIndicator(true)
  }, delay ?? null)

  if (disableMountWhileDelayed && !showActivityIndicator) {
    return null
  }

  return (
    <ActivityIndicator
      {...props}
      className={cn(
        props.className,
        'motion-safe:transition-opacity',
        !showActivityIndicator && 'opacity-0',
      )}
    />
  )
}

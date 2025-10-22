import {
  ActivityIndicator,
  ActivityIndicatorProps,
} from '@/components/ActivityIndicator'
import { useState } from 'react'
import { useTimeout } from 'usehooks-ts'

export interface DelayedActivityIndicatorProps extends ActivityIndicatorProps {
  delay?: number
}

export function DelayedActivityIndicator({ delay = 350, ...props }) {
  const [showActivityIndicator, setShowActivityIndicator] = useState(false)

  useTimeout(() => {
    setShowActivityIndicator(true)
  }, delay)

  if (!showActivityIndicator) {
    return null
  }

  return <ActivityIndicator {...props} />
}

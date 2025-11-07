import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

export interface UseLocationHistoryProps {
  maxStackSize: number
}

export function useLocationHistory(
  { maxStackSize }: UseLocationHistoryProps = { maxStackSize: 30 },
) {
  const [locationStack, setLocationStack] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const currentLocation = `${pathname}${search}`
  const targetIndexRef = useRef<number | null>(null)

  // Track location changes and update stack
  useEffect(() => {
    // If we're already at this location, skip
    if (locationStack[currentIndex] === currentLocation) {
      return
    }

    if (targetIndexRef.current !== null) {
      // This is a back/forward navigation from our own buttons
      setCurrentIndex(targetIndexRef.current)
      targetIndexRef.current = null
      return
    }

    // Manual navigation - add to stack and discard forward history
    const newStack = locationStack.slice(0, currentIndex + 1)
    newStack.push(currentLocation)

    // Limit stack size to prevent unbounded growth
    if (newStack.length > maxStackSize) {
      newStack.splice(0, newStack.length - maxStackSize)
    }

    setLocationStack(newStack)
    setCurrentIndex(newStack.length - 1)
  }, [currentLocation, currentIndex, locationStack, maxStackSize])

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      targetIndexRef.current = currentIndex - 1
      const targetLocation = locationStack[currentIndex - 1]
      navigate(targetLocation, { replace: false })
    }
  }, [currentIndex, locationStack, navigate])

  const goForward = useCallback(() => {
    if (currentIndex < locationStack.length - 1) {
      targetIndexRef.current = currentIndex + 1
      const targetLocation = locationStack[currentIndex + 1]
      navigate(targetLocation, { replace: false })
    }
  }, [currentIndex, locationStack, navigate])

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < locationStack.length - 1

  return {
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  }
}

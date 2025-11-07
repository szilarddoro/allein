import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

export function useLocationHistory() {
  const [locationStack, setLocationStack] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const currentLocation = `${pathname}${search}`
  const isHistoryNavigationRef = useRef(false)

  // Track location changes and update stack
  useEffect(() => {
    // If we're already at this location, skip
    if (locationStack[currentIndex] === currentLocation) {
      return
    }

    if (isHistoryNavigationRef.current) {
      // This is a back/forward navigation from our own buttons
      const existingIndex = locationStack.indexOf(currentLocation)
      if (existingIndex !== -1) {
        setCurrentIndex(existingIndex)
        isHistoryNavigationRef.current = false
        return
      }
    }

    // Manual navigation - add to stack and discard forward history
    const newStack = locationStack.slice(0, currentIndex + 1)
    newStack.push(currentLocation)

    setLocationStack(newStack)
    setCurrentIndex(newStack.length - 1)
    isHistoryNavigationRef.current = false
  }, [currentLocation, currentIndex, locationStack])

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      isHistoryNavigationRef.current = true
      const targetLocation = locationStack[currentIndex - 1]
      navigate(targetLocation, { replace: false })
    }
  }, [currentIndex, locationStack, navigate])

  const goForward = useCallback(() => {
    if (currentIndex < locationStack.length - 1) {
      isHistoryNavigationRef.current = true
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

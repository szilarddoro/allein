import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

export function useLocationHistory() {
  const [locationStack, setLocationStack] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const currentLocation = `${pathname}${search}`
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    // If we're navigating to a location that's already in our stack at the current position, ignore it
    if (locationStack[currentIndex] === currentLocation) {
      return
    }

    // Check if this location exists elsewhere in the stack (back/forward navigation)
    const existingIndex = locationStack.indexOf(currentLocation)

    if (isNavigatingRef.current && existingIndex !== -1) {
      // This is a back/forward navigation to an existing location
      setCurrentIndex(existingIndex)
      isNavigatingRef.current = false
      return
    }

    // This is a new navigation - add to stack and trim forward history if needed
    const newStack =
      currentIndex === -1
        ? [currentLocation]
        : [...locationStack.slice(0, currentIndex + 1), currentLocation]

    setLocationStack(newStack)
    setCurrentIndex(newStack.length - 1)
    isNavigatingRef.current = false
  }, [currentLocation, currentIndex, locationStack])

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      isNavigatingRef.current = true
      navigate(-1)
    }
  }, [currentIndex, navigate])

  const goForward = useCallback(() => {
    if (currentIndex < locationStack.length - 1) {
      isNavigatingRef.current = true
      navigate(1)
    }
  }, [currentIndex, locationStack.length, navigate])

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < locationStack.length - 1

  return {
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  }
}

import { LocationHistoryContext } from '@/lib/locationHistory/LocationHistoryContext'
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router'

export const MAX_STACK_SIZE = 30

export function LocationHistoryProvider({ children }: PropsWithChildren) {
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
    if (newStack.length > MAX_STACK_SIZE) {
      newStack.splice(0, newStack.length - MAX_STACK_SIZE)
    }

    setLocationStack(newStack)
    setCurrentIndex(newStack.length - 1)
  }, [currentLocation, currentIndex, locationStack])

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

  const removeEntriesForFile = useCallback(
    (filePath: string) => {
      setLocationStack((prevStack) => {
        // Filter out entries that reference this file
        const newStack = prevStack.filter(
          (location) =>
            !location.includes(`file=${encodeURIComponent(filePath)}`),
        )

        // Adjust currentIndex if needed
        const newIndex = Math.min(currentIndex, newStack.length - 1)
        setCurrentIndex(newIndex)

        // If current location references deleted file, navigate to home
        if (
          pathname === '/editor' &&
          search.includes(`file=${encodeURIComponent(filePath)}`)
        ) {
          navigate('/', { replace: true })
        }

        return newStack
      })
    },
    [currentIndex, pathname, search, navigate],
  )

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < locationStack.length - 1

  return (
    <LocationHistoryContext.Provider
      value={{
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        removeEntriesForFile,
      }}
    >
      {children}
    </LocationHistoryContext.Provider>
  )
}

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

// Normalize location by removing 'focus' and 'line' query params
function normalizeLocation(location: string): string {
  const [pathname, search] = location.split('?')
  if (!search) return pathname

  const params = new URLSearchParams(search)
  params.delete('focus')
  params.delete('line')

  const normalizedSearch = params.toString()
  return normalizedSearch ? `${pathname}?${normalizedSearch}` : pathname
}

// Remove adjacent duplicates from array
function deduplicateAdjacent<T>(arr: T[]): T[] {
  return arr.reduce((acc, item) => {
    if (acc[acc.length - 1] !== item) {
      acc.push(item)
    }
    return acc
  }, [] as T[])
}

export function LocationHistoryProvider({ children }: PropsWithChildren) {
  const locationStackRef = useRef<string[]>([])
  const currentIndexRef = useRef(-1)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const currentLocation = normalizeLocation(`${pathname}${search}`)
  const targetIndexRef = useRef<number | null>(null)

  // Helper to update button states based on current ref values
  const updateButtonStates = useCallback(() => {
    setCanGoBack(currentIndexRef.current > 0)
    setCanGoForward(
      currentIndexRef.current < locationStackRef.current.length - 1,
    )
  }, [])

  // Track location changes and update stack
  useEffect(() => {
    // If we're already at this location, skip
    if (locationStackRef.current[currentIndexRef.current] === currentLocation) {
      return
    }

    if (targetIndexRef.current !== null) {
      // This is a back/forward navigation from our own buttons
      currentIndexRef.current = targetIndexRef.current
      targetIndexRef.current = null
      updateButtonStates()
      return
    }

    // Manual navigation - add to stack and discard forward history
    const newStack = locationStackRef.current.slice(
      0,
      currentIndexRef.current + 1,
    )
    newStack.push(currentLocation)

    // Limit stack size to prevent unbounded growth
    if (newStack.length > MAX_STACK_SIZE) {
      newStack.splice(0, newStack.length - MAX_STACK_SIZE)
    }

    locationStackRef.current = newStack
    currentIndexRef.current = newStack.length - 1
    updateButtonStates()
  }, [currentLocation, updateButtonStates])

  const goBack = useCallback(() => {
    if (currentIndexRef.current > 0) {
      targetIndexRef.current = currentIndexRef.current - 1
      const targetLocation =
        locationStackRef.current[currentIndexRef.current - 1]
      navigate(targetLocation, { replace: false })
    }
  }, [navigate])

  const goForward = useCallback(() => {
    if (currentIndexRef.current < locationStackRef.current.length - 1) {
      targetIndexRef.current = currentIndexRef.current + 1
      const targetLocation =
        locationStackRef.current[currentIndexRef.current + 1]
      navigate(targetLocation, { replace: false })
    }
  }, [navigate])

  const removeEntriesForFile = useCallback(
    (filePath: string) => {
      // Filter out entries that reference this file
      let newStack = locationStackRef.current.filter(
        (location) =>
          !location.includes(`file=${encodeURIComponent(filePath)}`),
      )

      newStack = deduplicateAdjacent(newStack)

      // Adjust currentIndex if needed
      const newIndex = Math.min(currentIndexRef.current, newStack.length - 1)
      currentIndexRef.current = newIndex

      locationStackRef.current = newStack
      updateButtonStates()
    },
    [updateButtonStates],
  )

  const removeEntriesForFolder = useCallback(
    (folderPath: string) => {
      // Filter out entries that reference files inside this folder
      // A file is inside a folder if its path starts with folderPath + '/'
      let newStack = locationStackRef.current.filter((location) => {
        // Check if location contains a file parameter that's inside this folder
        const fileParamMatch = location.match(/file=([^&]+)/)
        if (!fileParamMatch) return true // Keep non-file entries (like folders)

        const filePath = decodeURIComponent(fileParamMatch[1])
        // Remove if file is the folder itself or inside the folder
        return !(
          filePath === folderPath || filePath.startsWith(folderPath + '/')
        )
      })

      newStack = deduplicateAdjacent(newStack)

      // Adjust currentIndex if needed
      const newIndex = Math.min(currentIndexRef.current, newStack.length - 1)
      currentIndexRef.current = newIndex

      locationStackRef.current = newStack
      updateButtonStates()
    },
    [updateButtonStates],
  )

  return (
    <LocationHistoryContext.Provider
      value={{
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        removeEntriesForFile,
        removeEntriesForFolder,
      }}
    >
      {children}
    </LocationHistoryContext.Provider>
  )
}

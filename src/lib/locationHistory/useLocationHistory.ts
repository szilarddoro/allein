import { LocationHistoryContext } from '@/lib/locationHistory/LocationHistoryContext'
import { useContext } from 'react'

export function useLocationHistory() {
  const context = useContext(LocationHistoryContext)

  if (!context) {
    throw new Error(
      'useLocationHistory must be used in a LocationHistoryContext',
    )
  }

  return context
}

import { useQuery } from '@tanstack/react-query'
import { getDatabase } from './database'

export function useDatabase() {
  return useQuery({
    queryKey: ['database'],
    queryFn: getDatabase,
  })
}

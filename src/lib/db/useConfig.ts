import { useQuery } from '@tanstack/react-query'
import { getAllConfig } from '@/lib/db/database'

export const USE_CONFIG_QUERY_KEY = 'config'

export function useConfig() {
  return useQuery({
    queryKey: [USE_CONFIG_QUERY_KEY],
    queryFn: async () => {
      return getAllConfig()
    },
  })
}

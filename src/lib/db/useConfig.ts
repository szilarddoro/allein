import { useQuery } from '@tanstack/react-query'
import { ConfigModel, getDatabase } from '@/lib/db/database'

export const USE_CONFIG_QUERY_KEY = 'config'

export function useConfig() {
  return useQuery({
    queryKey: [USE_CONFIG_QUERY_KEY],
    queryFn: async () => {
      const database = await getDatabase()
      return database.select<ConfigModel[]>('SELECT * FROM config')
    },
  })
}

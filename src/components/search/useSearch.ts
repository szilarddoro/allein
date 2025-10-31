import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileSearchResult } from '@/lib/search/types'

export const SEARCH_QUERY_KEY = (query: string) => ['search', query]

export function useSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: SEARCH_QUERY_KEY(query),
    queryFn: () => invoke<FileSearchResult[]>('search_files', { query }),
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

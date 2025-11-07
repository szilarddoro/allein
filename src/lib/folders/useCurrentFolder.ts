import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

export const CURRENT_FOLDER_QUERY_KEY = ['current-folder']

export function useCurrentFolder() {
  return useQuery({
    queryKey: CURRENT_FOLDER_QUERY_KEY,
    queryFn: () => invoke<string>('get_current_docs_folder'),
    staleTime: Infinity,
  })
}

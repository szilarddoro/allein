import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

export const DOCS_FOLDER_QUERY_KEY = () => ['docs-folder']

export function useCurrentDocsFolder() {
  return useQuery({
    queryKey: DOCS_FOLDER_QUERY_KEY(),
    queryFn: () => invoke<string>('get_current_docs_folder'),
    retry: 3,
    refetchOnMount: 'always',
  })
}

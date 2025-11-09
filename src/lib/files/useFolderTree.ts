import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FolderNode } from './types'

export const FOLDER_TREE_QUERY_KEY = () => ['folder-tree']

export function useFolderTree() {
  return useQuery({
    queryKey: FOLDER_TREE_QUERY_KEY(),
    queryFn: () => invoke<FolderNode[]>('list_folder_tree'),
    retry: 3,
    refetchOnMount: 'always',
  })
}

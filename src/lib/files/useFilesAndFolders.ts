import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileInfoWithPreview, TreeItem } from './types'

interface UseFilesAndFoldersReturn {
  data: TreeItem[]
  status: 'pending' | 'error' | 'success'
  error: Error | null
  refetch: () => void
}

// Query key for files and folders tree
export const FILES_AND_FOLDERS_TREE_QUERY_KEY = () => ['files-and-folders-tree']

// Query key for basic file list (for backwards compatibility with mutation invalidation)
export const FILES_QUERY_KEY = () => ['files']

// Query key for files with preview (for backwards compatibility with mutation invalidation)
export const FILES_WITH_PREVIEW_QUERY_KEY = () => ['files-with-preview']

/**
 * Flatten a tree structure to get all files (for backwards compatibility)
 */
export function flattenTreeItems(items: TreeItem[]): FileInfoWithPreview[] {
  const files: FileInfoWithPreview[] = []

  function traverse(items: TreeItem[]) {
    for (const item of items) {
      if (item.type === 'file') {
        files.push({
          name: item.name,
          path: item.path,
          preview: item.preview || '',
          size: item.size || 0,
          modified: item.modified || '',
        })
      } else if (item.children) {
        traverse(item.children)
      }
    }
  }

  traverse(items)
  return files
}

/**
 * Unified hook for fetching both files and folders as a tree structure
 * @returns Files and folders in a nested tree structure
 */
export function useFilesAndFolders(): UseFilesAndFoldersReturn {
  const query = useQuery({
    queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
    queryFn: () => invoke<TreeItem[]>('list_files_and_folders_tree'),
    retry: 3,
    refetchOnMount: 'always',
  })

  return {
    data: query.data || [],
    status: query.status as 'pending' | 'error' | 'success',
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  }
}

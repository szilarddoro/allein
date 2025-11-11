import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { TreeItem } from './types'
import type { FileInfoWithPreview } from './types'

interface UseFilesAndFoldersReturn {
  data: TreeItem[]
  status: 'pending' | 'error' | 'success'
  error: Error | null
  refetch: () => void
}

// Query key for files and folders tree
export const FILES_AND_FOLDERS_TREE_QUERY_KEY = (
  folderPath: string | undefined = undefined,
) => {
  if (folderPath) {
    return ['files-and-folders-tree', folderPath]
  }
  return ['files-and-folders-tree']
}

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
          preview: item.preview,
          size: item.size,
          modified: item.modified,
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
 * Flatten a tree structure to get all files and folders with type information
 * Useful for duplicate checking where files and folders need to be differentiated
 */
export function flattenTreeItemsWithType(
  items: TreeItem[],
): Array<{ name: string; path: string; type: 'file' | 'folder' }> {
  const items_flattened: Array<{
    name: string
    path: string
    type: 'file' | 'folder'
  }> = []

  function traverse(items: TreeItem[]) {
    for (const item of items) {
      items_flattened.push({
        name: item.name,
        path: item.path,
        type: item.type,
      })

      if (item.type === 'folder' && item.children) {
        traverse(item.children)
      }
    }
  }

  traverse(items)
  return items_flattened
}

/**
 * Sort tree items with folders first, then files, both alphabetically
 */
function sortTreeItems(items: TreeItem[]): TreeItem[] {
  const sorted = [...items].sort((a, b) => {
    // Folders come first
    if (a.type === 'folder' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'folder') return 1
    // Otherwise, sort alphabetically by name
    return a.name.localeCompare(b.name)
  })

  // Recursively sort children for folders
  return sorted.map((item) => {
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: sortTreeItems(item.children),
      }
    }
    return item
  })
}

export interface UseFilesAndFoldersProps {
  currentFolderPath?: string
}

export function useFilesAndFolders({
  currentFolderPath,
}: UseFilesAndFoldersProps = {}): UseFilesAndFoldersReturn {
  const query = useQuery({
    queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(currentFolderPath),
    queryFn: () =>
      invoke<TreeItem[]>('list_files_and_folders_tree', {
        folderPath: currentFolderPath || null,
      }),
    retry: false,
    refetchOnMount: 'always',
  })

  return {
    data: sortTreeItems(query.data || []),
    status: query.status as 'pending' | 'error' | 'success',
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  }
}

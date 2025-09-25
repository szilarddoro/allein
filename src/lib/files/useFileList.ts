import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileInfo } from './types'

export const FILES_QUERY_KEY = () => ['files']

export function useFileList() {
  const {
    data: files = [],
    isLoading,
    error,
    refetch: loadFiles,
  } = useQuery({
    queryKey: FILES_QUERY_KEY(),
    queryFn: () => invoke<FileInfo[]>('list_files'),
    retry: 3,
  })

  return {
    files,
    isLoading,
    error: error instanceof Error ? error.message : null,
    loadFiles,
  }
}

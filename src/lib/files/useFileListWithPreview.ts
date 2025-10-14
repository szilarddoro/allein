import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileInfoWithPreview } from './types'

export const FILES_WITH_PREVIEW_QUERY_KEY = () => ['files-with-preview']

export function useFileListWithPreview() {
  return useQuery({
    queryKey: FILES_WITH_PREVIEW_QUERY_KEY(),
    queryFn: () => invoke<FileInfoWithPreview[]>('list_files_with_preview'),
    retry: 3,
    refetchOnMount: 'always',
  })
}

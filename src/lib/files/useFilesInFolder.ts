import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileInfoWithPreview } from './types'

export const FILES_IN_FOLDER_QUERY_KEY = (folderPath: string) => [
  'files-in-folder',
  folderPath,
]

export function useFilesInFolder(folderPath: string) {
  return useQuery({
    queryKey: FILES_IN_FOLDER_QUERY_KEY(folderPath),
    queryFn: () =>
      invoke<FileInfoWithPreview[]>('list_files_in_folder', { folderPath }),
    retry: 3,
    refetchOnMount: 'always',
  })
}

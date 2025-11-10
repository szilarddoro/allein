import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileContent } from './types'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'

export function useCreateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => invoke<FileContent>('create_file'),
    onSuccess: async (newFile) => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
          }),
          queryClient.invalidateQueries({
            queryKey: READ_FILE_QUERY_KEY(newFile.path),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

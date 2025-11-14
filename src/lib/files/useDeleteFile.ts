import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { useLogger } from '@/lib/logging/useLogger'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'

export function useDeleteFile() {
  const queryClient = useQueryClient()
  const logger = useLogger()

  return useMutation({
    mutationFn: (filePath: string) => invoke('delete_file', { filePath }),
    onSuccess: async (_data, filePath) => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: READ_FILE_QUERY_KEY(filePath),
          }),
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
    onError: (error) => {
      logger.error('file', `Failed to delete file: ${error.message}`, {
        stack: error.stack || null,
      })
    },
  })
}

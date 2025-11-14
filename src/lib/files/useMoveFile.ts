import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { useLogger } from '@/lib/logging/useLogger'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'

export function useMoveFile() {
  const queryClient = useQueryClient()
  const logger = useLogger()

  return useMutation({
    mutationFn: ({
      fromPath,
      toFolder,
    }: {
      fromPath: string
      toFolder: string
    }) => invoke<string>('move_file', { fromPath, toFolder }),
    onSuccess: async (_data, { fromPath }) => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: READ_FILE_QUERY_KEY(fromPath),
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
      logger.error('file', `Failed to move file: ${error.message}`, {
        stack: error.stack,
      })
    },
  })
}

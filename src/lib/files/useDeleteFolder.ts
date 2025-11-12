import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { useLogger } from '@/lib/logging/useLogger'

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const logger = useLogger()

  return useMutation({
    mutationFn: (folderPath: string) => invoke('delete_folder', { folderPath }),
    onSuccess: async () => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
    onError: (error) => {
      logger.error('folder', `Failed to delete folder: ${error.message}`, {
        stack: error.stack || null,
      })
    },
  })
}

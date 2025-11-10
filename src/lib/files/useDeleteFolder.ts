import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import {
  FILES_QUERY_KEY,
  FILES_WITH_PREVIEW_QUERY_KEY,
} from './useFilesAndFolders'

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (folderPath: string) => invoke('delete_folder', { folderPath }),
    onSuccess: async () => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY() }),
          queryClient.invalidateQueries({
            queryKey: FILES_WITH_PREVIEW_QUERY_KEY(),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'

export function useMoveFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fromPath,
      toFolder,
    }: {
      fromPath: string
      toFolder: string
    }) => invoke<string>('move_file', { fromPath, toFolder }),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({
          queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
        })
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'

export interface UseCreateFolderOptions {
  targetFolder?: string
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: UseCreateFolderOptions = {}) =>
      invoke<string>('create_folder', {
        folderPath: options.targetFolder || null,
      }),
    onSuccess: async (_newFolderPath, variables) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(variables.targetFolder),
        })
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

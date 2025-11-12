import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { TRIGGER_FOLDER_NAME_EDIT } from '@/lib/constants'

export interface UseCreateFolderOptions {
  targetFolder?: string
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: UseCreateFolderOptions = {}) =>
      invoke<string>('create_untitled_folder', {
        parentFolderPath: options.targetFolder || null,
      }),
    onSuccess: async (newPath) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
        })

        window.dispatchEvent(
          new CustomEvent(TRIGGER_FOLDER_NAME_EDIT, { detail: newPath }),
        )
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

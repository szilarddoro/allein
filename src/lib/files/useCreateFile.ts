import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileContent } from './types'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'
import { useLogger } from '@/lib/logging/useLogger'

export interface UseCreateFileOptions {
  targetFolder?: string
}

export function useCreateFile() {
  const queryClient = useQueryClient()
  const logger = useLogger()

  return useMutation({
    mutationFn: (options: UseCreateFileOptions = {}) =>
      invoke<FileContent>('create_file', {
        folderPath: options.targetFolder || null,
      }),
    onSuccess: async (newFile, variables) => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(variables.targetFolder),
          }),
          queryClient.invalidateQueries({
            queryKey: READ_FILE_QUERY_KEY(newFile.path),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
    onError: (error) => {
      logger.error('file', `Failed to create file: ${error.message}`)
    },
  })
}

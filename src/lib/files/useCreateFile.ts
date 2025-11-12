import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileContent } from './types'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'
import { useLogger } from '@/lib/logging'

export interface UseCreateFileOptions {
  targetFolder?: string
}

export function useCreateFile() {
  const queryClient = useQueryClient()
  const { info, error: logError } = useLogger()

  return useMutation({
    mutationFn: (options: UseCreateFileOptions = {}) =>
      invoke<FileContent>('create_file', {
        folderPath: options.targetFolder || null,
      }),
    onSuccess: async (newFile, variables) => {
      try {
        info('file', `File created: ${newFile.path}`)
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
      logError('file', `Failed to create file: ${error.message}`)
    },
  })
}

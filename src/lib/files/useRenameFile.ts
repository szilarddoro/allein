import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_QUERY_KEY } from './useFileList'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'
import { ensureMdExtension } from './fileUtils'

export function useRenameFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      oldPath,
      newName,
    }: {
      oldPath: string
      newName: string
    }) => {
      // Ensure the new name has .md extension
      const fullFileName = ensureMdExtension(newName)
      return invoke<string>('rename_file', { oldPath, newName: fullFileName })
    },
    onMutate: async ({ oldPath, newName }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: READ_FILE_QUERY_KEY(oldPath),
      })

      // Snapshot the previous value
      const previousFile = queryClient.getQueryData(
        READ_FILE_QUERY_KEY(oldPath),
      )

      // Optimistically update the file path
      const newPath = oldPath.replace(/[^/]+$/, ensureMdExtension(newName))
      queryClient.setQueryData(READ_FILE_QUERY_KEY(newPath), previousFile)

      return { previousFile, newPath }
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFile) {
        queryClient.setQueryData(
          READ_FILE_QUERY_KEY(variables.oldPath),
          context.previousFile,
        )
      }
    },
    onSuccess: async (newPath) => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY() }),
          queryClient.invalidateQueries({
            queryKey: READ_FILE_QUERY_KEY(newPath),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

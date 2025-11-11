import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from './useFilesAndFolders'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'
import { ensureMdExtension } from './fileUtils'
import { validateFileName, checkDuplicateFileName } from './validation'

interface RenameFileParams {
  oldPath: string
  newName: string
  existingFiles?: Array<{ name: string; path: string }>
}

export function useRenameFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ oldPath, newName, existingFiles }: RenameFileParams) => {
      // Validate the new file name
      const { isValid, error } = validateFileName(newName)
      if (!isValid) {
        const errorMessages: Record<string, string> = {
          empty: 'File name cannot be empty',
          'too-long': 'File name is too long (max 255 characters)',
          invalid: 'File name contains invalid characters: < > : " / \\ | ? *',
          reserved: 'File name is reserved by the operating system',
          'invalid-leading-trailing':
            'File name cannot start or end with spaces or dots',
          'consecutive-dots': 'File name cannot contain consecutive dots',
          'control-characters': 'File name contains control characters',
        }
        throw new Error(errorMessages[error] || 'Invalid file name')
      }

      // Check for duplicate file names in the same directory
      if (existingFiles) {
        const fullFileName = ensureMdExtension(newName)
        const { isDuplicate } = checkDuplicateFileName(
          fullFileName,
          oldPath,
          existingFiles,
        )

        if (isDuplicate) {
          throw new Error('File name is already taken')
        }
      }

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
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
          }),
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

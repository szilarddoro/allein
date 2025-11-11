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
  itemType?: 'file' | 'folder'
}

export function useRenameFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      oldPath,
      newName,
      existingFiles,
      itemType = 'file',
    }: RenameFileParams) => {
      // Validate the new file name
      const { isValid, error } = validateFileName(newName)
      if (!isValid) {
        const errorMessages: Record<string, string> = {
          empty: 'File name cannot be empty',
          'too-long': 'File name is too long (max 255 characters)',
          invalid:
            'File name contains invalid characters: . < > : " / \\ | ? *',
          reserved: 'File name is reserved by the operating system',
          'invalid-leading-trailing':
            'File name cannot start or end with spaces or dots',
          'consecutive-dots': 'File name cannot contain consecutive dots',
          'control-characters': 'File name contains control characters',
        }
        throw new Error(errorMessages[error] || 'Invalid file name')
      }

      // Only add .md extension for files, not folders
      const fullName =
        itemType === 'file' ? ensureMdExtension(newName) : newName

      // Check for duplicate file names in the same directory
      if (existingFiles) {
        const { isDuplicate } = checkDuplicateFileName(
          fullName,
          oldPath,
          existingFiles,
        )

        if (isDuplicate) {
          throw new Error('File name is already taken')
        }
      }

      const newPath = await invoke<string>('rename_file', {
        oldPath,
        newName: fullName,
      })

      return {
        newPath,
        oldPath,
        itemType,
      }
    },
    onSuccess: async ({ newPath }) => {
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

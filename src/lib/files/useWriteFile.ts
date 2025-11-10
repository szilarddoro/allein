import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { queryClient } from '@/lib/queryClientConfig'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from '@/lib/files/useFilesAndFolders'

export function useWriteFile() {
  return useMutation({
    mutationFn: ({
      filePath,
      content,
    }: {
      filePath: string
      content: string
    }) => invoke('write_file', { filePath, content }),
    onSuccess: async (_, { filePath }) => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: READ_FILE_QUERY_KEY(filePath),
            refetchType: 'none',
          }),
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
          }),
        ])
      } catch {
        // silently ignore invalidation errors
      }
    },
  })
}

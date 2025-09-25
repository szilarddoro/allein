import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { queryClient } from '@/lib/queryClientConfig'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'

export function useWriteFile() {
  return useMutation({
    mutationFn: ({
      filePath,
      content,
    }: {
      filePath: string
      content: string
    }) => invoke('write_file', { filePath, content }),
    onSuccess: (_, { filePath }) => {
      queryClient.invalidateQueries({ queryKey: READ_FILE_QUERY_KEY(filePath) })
    },
  })
}

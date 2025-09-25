import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_QUERY_KEY } from './useFileList'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'

export function useRenameFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ oldPath, newName }: { oldPath: string; newName: string }) =>
      invoke<string>('rename_file', { oldPath, newName }),
    onSuccess: (newPath) => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY() })
      queryClient.invalidateQueries({ queryKey: READ_FILE_QUERY_KEY(newPath) })
    },
  })
}

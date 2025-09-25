import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileContent } from './types'
import { FILES_QUERY_KEY } from './useFileList'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'

export function useCreateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => invoke<FileContent>('create_file'),
    onSuccess: (newFile) => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY() })
      queryClient.invalidateQueries({
        queryKey: READ_FILE_QUERY_KEY(newFile.path),
      })
    },
  })
}

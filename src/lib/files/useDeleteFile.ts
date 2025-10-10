import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FILES_QUERY_KEY } from './useFileList'
import { READ_FILE_QUERY_KEY } from '@/lib/files/useReadFile'
import { FILES_WITH_PREVIEW_QUERY_KEY } from '@/lib/files/useFileListWithPreview'

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filePath: string) => invoke('delete_file', { filePath }),
    onSuccess: (_, filePath) => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY() })
      queryClient.invalidateQueries({
        queryKey: FILES_WITH_PREVIEW_QUERY_KEY(),
      })
      queryClient.invalidateQueries({ queryKey: READ_FILE_QUERY_KEY(filePath) })
    },
  })
}

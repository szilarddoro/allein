import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileContent } from './types'

export const READ_FILE_QUERY_KEY = (filePath: string | null) => [
  'file',
  filePath,
]

export function useReadFile(filePath: string | null) {
  return useQuery({
    queryKey: READ_FILE_QUERY_KEY(filePath),
    queryFn: async () => {
      const fileContent = await invoke<FileContent>('read_file', {
        filePath: filePath!,
      })

      // Enhance the response with the file name
      return {
        ...fileContent,
        name: filePath!.split('/').pop() || '',
      }
    },
    enabled: !!filePath,
    retry: false,
  })
}

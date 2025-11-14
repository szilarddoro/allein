import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from '@/lib/files/useFilesAndFolders'
import { DOCS_FOLDER_QUERY_KEY } from '@/lib/files/useCurrentDocsFolder'
import { useLogger } from '@/lib/logging/useLogger'
import { READ_FILE_BASE_QUERY_KEY } from '@/lib/files/useReadFile'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'

export function useSetFolder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logger = useLogger()
  const { clearLocationHistory } = useLocationHistory()

  return useMutation({
    mutationFn: (folderPath: string) =>
      invoke<void>('set_docs_folder', { folderPath }),
    onSuccess: async () => {
      clearLocationHistory()
      // Navigate to browser page to avoid showing missing file error
      navigate('/', { viewTransition: true, replace: true })

      try {
        // Invalidate all file queries to refetch from new folder
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [READ_FILE_BASE_QUERY_KEY],
          }),
          queryClient.invalidateQueries({
            queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
          }),
          queryClient.invalidateQueries({ queryKey: DOCS_FOLDER_QUERY_KEY() }),
        ])
      } catch {
        // Silently fail
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to switch folder')
      logger.error('folder', `Failed to switch folder: ${error.message}`, {
        stack: error.stack || null,
      })
    },
  })
}

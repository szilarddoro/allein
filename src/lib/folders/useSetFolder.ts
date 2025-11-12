import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FILES_AND_FOLDERS_TREE_QUERY_KEY } from '@/lib/files/useFilesAndFolders'
import { DOCS_FOLDER_QUERY_KEY } from '@/lib/files/useCurrentDocsFolder'

export function useSetFolder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (folderPath: string) =>
      invoke<void>('set_docs_folder', { folderPath }),
    onSuccess: async () => {
      // Navigate to browser page to avoid showing missing file error
      navigate('/', { viewTransition: true, replace: true })

      // Invalidate all file queries to refetch from new folder
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: FILES_AND_FOLDERS_TREE_QUERY_KEY(),
        }),
        queryClient.invalidateQueries({ queryKey: DOCS_FOLDER_QUERY_KEY() }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to switch folder')
    },
  })
}

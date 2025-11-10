import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { useCurrentFolder } from '@/lib/folders/useCurrentFolder'

export function useRelativePath() {
  const { data: currentFolder, status: currentFolderStatus } =
    useCurrentFolder()
  const [currentFolderPath] = useCurrentFolderPath()

  if (currentFolderStatus !== 'success') {
    return { selectedFolder: null, segments: null }
  }

  const relativePath = currentFolderPath.replace(currentFolder, '')

  return {
    selectedFolder: currentFolder,
    segments: relativePath.split('/').filter(Boolean),
  }
}

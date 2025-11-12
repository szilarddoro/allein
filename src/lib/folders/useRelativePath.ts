import { useCurrentDocsFolder } from '@/lib/files/useCurrentDocsFolder'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'

export function useRelativePath() {
  const { data: currentFolder, status: currentFolderStatus } =
    useCurrentDocsFolder()
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

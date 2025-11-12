import { useCurrentDocsDir } from '@/lib/files/useCurrentDocsDir'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useMoveFile } from '@/lib/files/useMoveFile'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { useToast } from '@/lib/useToast'
import { useMoveFolder } from '@/lib/folders/useMoveFolder'
import { DragEndEvent, useDndMonitor } from '@dnd-kit/core'
import { useCallback } from 'react'
import { HOME_FOLDER_KEY } from '@/lib/constants'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'

function getCleanId(id: string) {
  return decodeURIComponent(id.replace(/^(browser|sidebar|breadcrumb)-/, ''))
}

export function useMoveItemOnDrop() {
  const { removeEntriesForFile, removeEntriesForFolder } = useLocationHistory()
  const { data: currentDocsDir } = useCurrentDocsDir()
  const { mutateAsync: moveFile } = useMoveFile()
  const { mutateAsync: moveFolder } = useMoveFolder()
  const { toast } = useToast()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const [currentFolderPath, updateCurrentFolderPath] = useCurrentFolderPath()

  const handleDragEnd = useCallback(
    async (ev: DragEndEvent) => {
      const { active, over } = ev

      // Return early in case either the active element or the element the user is hovering over is missing
      if (!over || !active || !active.id || !over.id || active.id === over.id) {
        return
      }

      const fromPath = getCleanId(active.id.toString())
      let toFolder = getCleanId(over.id.toString())

      // Replace the home folder reference with the selected directory
      if (toFolder.endsWith(HOME_FOLDER_KEY) && currentDocsDir) {
        toFolder = currentDocsDir
      }

      // Return early if the proper home folder was not available
      if (toFolder.endsWith(HOME_FOLDER_KEY)) {
        return
      }

      // Don't attempt to move into the same folder
      if (toFolder === fromPath.split('/').slice(0, -1).join('/')) {
        return
      }

      // Determine if we're moving a file or folder
      const isFile = fromPath.endsWith('.md')

      // Return early if a parent folder is moved into one of its descendants
      if (!isFile && toFolder.startsWith(fromPath)) {
        return
      }

      try {
        if (isFile) {
          const newPath = await moveFile({ fromPath, toFolder })
          removeEntriesForFile(fromPath)
          if (currentFilePath === fromPath) {
            updateCurrentFilePath(newPath)
          }
        } else {
          const newPath = await moveFolder({ fromPath, toFolder })
          removeEntriesForFolder(fromPath)
          if (currentFolderPath === fromPath) {
            updateCurrentFolderPath(newPath)
          }
        }
      } catch (err) {
        const itemType = isFile ? 'file' : 'folder'
        toast.error(
          err instanceof Error ? err.message : `Failed to move ${itemType}`,
        )
      }
    },
    [
      currentDocsDir,
      currentFilePath,
      currentFolderPath,
      moveFile,
      moveFolder,
      removeEntriesForFile,
      removeEntriesForFolder,
      toast,
      updateCurrentFilePath,
      updateCurrentFolderPath,
    ],
  )

  useDndMonitor({
    onDragEnd: handleDragEnd,
  })
}

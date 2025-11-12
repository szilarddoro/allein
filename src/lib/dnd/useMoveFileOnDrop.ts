import { useCurrentDocsDir } from '@/lib/files/useCurrentDocsDir'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useMoveFile } from '@/lib/files/useMoveFile'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { useToast } from '@/lib/useToast'
import { useMoveFolder } from '@/lib/folders/useMoveFolder'
import { DragEndEvent, useDndMonitor } from '@dnd-kit/core'
import { useCallback } from 'react'

export function useMoveFileOnDrop() {
  const { removeEntriesForFile } = useLocationHistory()
  const { data: currentDocsDir } = useCurrentDocsDir()
  const { mutateAsync: moveFile } = useMoveFile()
  const { mutateAsync: moveFolder } = useMoveFolder()
  const { toast } = useToast()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()

  const handleDragEnd = useCallback(
    async (ev: DragEndEvent) => {
      const { active, over } = ev

      if (!over || active.id === over.id || !over.id) {
        return
      }

      const fromPath = decodeURIComponent(
        active.id.toString().replace(/^(card|listitem|breadcrumb)-/, ''),
      )
      let toFolder = decodeURIComponent(
        over.id.toString().replace(/^(card|listitem|breadcrumb)-/, ''),
      )

      if (toFolder === 'home-folder' && currentDocsDir) {
        toFolder = currentDocsDir
      }

      // Return early if the proper home folder was not available
      if (toFolder === 'home-folder') {
        return
      }

      // Don't attempt to move into the same folder
      if (toFolder === fromPath.split('/').slice(0, -1).join('/')) {
        return
      }

      // Determine if we're moving a file or folder
      const isFile = fromPath.endsWith('.md')

      try {
        if (isFile) {
          const newPath = await moveFile({ fromPath, toFolder })
          removeEntriesForFile(fromPath)
          if (currentFilePath === fromPath) {
            updateCurrentFilePath(newPath)
          }
        } else {
          await moveFolder({ fromPath, toFolder })
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
      moveFile,
      moveFolder,
      removeEntriesForFile,
      toast,
      updateCurrentFilePath,
    ],
  )

  useDndMonitor({
    onDragEnd: handleDragEnd,
  })
}

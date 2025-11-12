import { useCurrentDocsDir } from '@/lib/files/useCurrentDocsDir'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useMoveFile } from '@/lib/files/useMoveFile'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { useToast } from '@/lib/useToast'
import { DragEndEvent, useDndMonitor } from '@dnd-kit/core'
import { useCallback } from 'react'

export function useMoveFileOnDrop() {
  const { removeEntriesForFile } = useLocationHistory()
  const { data: currentDocsDir } = useCurrentDocsDir()
  const { mutateAsync: moveFile } = useMoveFile()
  const { toast } = useToast()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()

  const handleDragEnd = useCallback(
    async (ev: DragEndEvent) => {
      const { active, over } = ev

      if (!over || active.id === over.id) {
        return
      }

      const fromPath = decodeURIComponent(active.id.toString())
      let toFolder = decodeURIComponent(over.id.toString())

      if (toFolder === 'home-folder' && currentDocsDir) {
        toFolder = currentDocsDir
      }

      // Return early if the proper home folder was not available
      if (toFolder === 'home-folder') {
        return
      }

      // Don't attempt to move the file into the same folder
      if (toFolder === fromPath.split('/').slice(0, -1).join('/')) {
        return
      }

      try {
        const newPath = await moveFile({ fromPath, toFolder })

        removeEntriesForFile(fromPath)
        if (currentFilePath === fromPath) {
          updateCurrentFilePath(newPath)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to move file')
      }
    },
    [
      currentDocsDir,
      currentFilePath,
      moveFile,
      removeEntriesForFile,
      toast,
      updateCurrentFilePath,
    ],
  )

  useDndMonitor({
    onDragEnd: handleDragEnd,
  })
}

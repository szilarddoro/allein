import { FileList } from '@/components/sidebar/FileList'
import { useSidebarContextMenu } from '@/components/sidebar/useSidebarContextMenu'
import { H2 } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { cn } from '@/lib/utils'
import { DragOverlay, useDndMonitor, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useState } from 'react'

export interface ScrollableFileListProps {
  activeId: string | number | null
  onCreateFile: () => void
  onCreateFolder: () => void
}

export function ScrollableFileList({
  onCreateFile,
  onCreateFolder,
}: ScrollableFileListProps) {
  const [activeItem, setActiveItem] = useState<string>()
  const [overFolder, setOverFolder] = useState<string>()
  const { showContextMenu } = useSidebarContextMenu()
  const { isOver, setNodeRef } = useDroppable({
    id: 'home-folder',
  })

  useDndMonitor({
    onDragOver: ({ active, over }) => {
      setActiveItem(active?.id?.toString() || '')
      setOverFolder(over?.id?.toString() || '')
    },
  })

  const decodedActiveItem = decodeURIComponent(activeItem || '')
  const decodedFolder = decodeURIComponent(overFolder || '')

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          'relative flex-1 overflow-y-auto pt-4 flex flex-col gap-2 px-2.5 pb-20 z-10',
          isOver &&
            'after:absolute after:inset-2 after:z-0 after:bg-blue-500/10 after:rounded-md after:pointer-events-none',
        )}
        onContextMenu={(e) =>
          showContextMenu(e, {
            onCreateFile,
            onCreateFolder,
          })
        }
      >
        <H2 className="sr-only">Files</H2>
        <FileList />
      </div>

      <DragOverlay
        modifiers={[restrictToWindowEdges]}
        dropAnimation={{
          duration: 0,
        }}
        className="z-[10000] translate-y-10"
      >
        {overFolder && (
          <div className="bg-black/40 backdrop-blur-xl border border-border px-2 py-1.5 text-xs rounded-md max-w-56">
            Move &quot;
            <span className="break-words">
              {getDisplayName(decodedActiveItem.split('/').pop() || '')}
            </span>
            &quot; to{' '}
            <span className="break-words">
              {decodedFolder === 'home-folder'
                ? 'home'
                : `"${decodedFolder.split('/').pop()}"`}
            </span>
          </div>
        )}
      </DragOverlay>
    </>
  )
}

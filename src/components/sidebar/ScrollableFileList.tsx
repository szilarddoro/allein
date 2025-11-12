import { FileList } from '@/components/sidebar/FileList'
import { useSidebarContextMenu } from '@/components/sidebar/useSidebarContextMenu'
import { H2 } from '@/components/ui/typography'
import { DragOverlay, useDndMonitor, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { DragOverlayTooltip } from '@/components/DragOverlayTooltip'
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
  const { setNodeRef } = useDroppable({
    id: 'home-folder',
  })

  useDndMonitor({
    onDragOver: ({ active, over }) => {
      setActiveItem(active?.id?.toString() || '')
      setOverFolder(over?.id?.toString() || '')
    },
  })

  const decodedActiveItem = decodeURIComponent(activeItem || '')
  const isActiveFile = decodedActiveItem.endsWith('.md')
  const decodedFolder = decodeURIComponent(overFolder || '')
  const targetFolder =
    decodedFolder === 'home-folder'
      ? 'the main folder'
      : decodedFolder.split('/').pop() || ''

  return (
    <>
      <div
        ref={setNodeRef}
        className="relative flex-1 overflow-y-auto pt-4 flex flex-col gap-2 px-2.5 pb-20 z-10"
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
        dropAnimation={{ duration: 0 }}
        className="z-[10000] translate-y-8"
      >
        <DragOverlayTooltip
          activeItem={decodedActiveItem}
          targetFolder={targetFolder}
          isActiveFile={isActiveFile}
          dragMessage="Move into"
          targetMessage="Drag over the sidebar"
        />
      </DragOverlay>
    </>
  )
}

import { FileList } from '@/components/sidebar/FileList'
import { useSidebarContextMenu } from '@/components/sidebar/useSidebarContextMenu'
import { H2 } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { cn } from '@/lib/utils'
import { DragOverlay, useDndMonitor, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { File, FolderClosed } from 'lucide-react'
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
  const isActiveFile = decodedActiveItem.endsWith('.md')
  const decodedFolder = decodeURIComponent(overFolder || '')

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          'relative flex-1 overflow-y-auto pt-4 flex flex-col gap-2 px-2.5 pb-20 z-10 motion-safe:transition-colors',
          isOver && 'bg-accent/70',
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
        dropAnimation={{ duration: 0 }}
        className="z-[10000] translate-y-8"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-border px-2 py-1.5 text-xs rounded-md max-w-56 flex flex-col gap-1.5 [&_svg]:size-3">
          <div className="flex flex-row gap-1.5 items-center">
            {isActiveFile ? <File /> : <FolderClosed />}
            <span>
              {getDisplayName(decodedActiveItem.split('/').pop() || '')}
            </span>
          </div>

          <div className="text-muted-foreground">
            Move into{' '}
            <span className="break-words">
              {decodedFolder === 'home-folder'
                ? 'the main folder'
                : `"${decodedFolder.split('/').pop() || ''}"`}
            </span>
          </div>
        </div>
      </DragOverlay>
    </>
  )
}

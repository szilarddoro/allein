import { File, FolderClosed } from 'lucide-react'
import { getDisplayName } from '@/lib/files/fileUtils'
import { DragOverlay, useDndMonitor } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useState } from 'react'

export interface DragOverlayTooltipProps {
  className?: string
  tooltipClassName?: string
}

export function DragOverlayTooltip({
  className,
  tooltipClassName,
}: DragOverlayTooltipProps) {
  const [activeItem, setActiveItem] = useState<string>()
  const [overFolder, setOverFolder] = useState<string>()

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
  const displayName = getDisplayName(decodedActiveItem.split('/').pop() || '')

  return createPortal(
    <DragOverlay
      modifiers={[restrictToWindowEdges]}
      dropAnimation={{ duration: 0 }}
      className={cn('z-[10000]', className)}
    >
      <div
        className={cn(
          'w-full bg-black/70 dark:bg-black/40 text-white backdrop-blur-xl dark:border border-border px-2 py-1.5 text-sm rounded-md max-w-56 flex flex-col gap-0.5 [&_svg]:size-3',
          tooltipClassName,
        )}
      >
        <div className="flex flex-row gap-1.5 items-center">
          {isActiveFile ? <File /> : <FolderClosed />}
          <span className="font-medium">{displayName}</span>
        </div>

        <div className="text-white/80 dark:text-muted-foreground">
          {targetFolder ? (
            <span>
              Move into <span className="break-words">{targetFolder}</span>
            </span>
          ) : (
            <span>Select a folder</span>
          )}
        </div>
      </div>
    </DragOverlay>,
    document.body,
  )
}

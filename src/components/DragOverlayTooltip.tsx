import { File, FolderClosed } from 'lucide-react'
import { getDisplayName } from '@/lib/files/fileUtils'
import { DragOverlay, useDndMonitor } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { memo, useState } from 'react'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { HOME_FOLDER_KEY } from '@/lib/constants'
import { getCleanDndId } from '@/lib/dnd/getCleanDndId'
import { useCurrentDocsDir } from '@/lib/files/useCurrentDocsDir'

export interface DragOverlayTooltipProps {
  className?: string
  tooltipClassName?: string
}

export const DragOverlayTooltip = memo(
  ({ className, tooltipClassName }: DragOverlayTooltipProps) => {
    const { data: currentDocsDir } = useCurrentDocsDir()
    const [currentFolderPath] = useCurrentFolderPath()
    const [activeItem, setActiveItem] = useState<string>()
    const [overFolder, setOverFolder] = useState<string>()

    useDndMonitor({
      onDragOver: ({ active, over }) => {
        setActiveItem(getCleanDndId(active?.id?.toString() || ''))
        setOverFolder(getCleanDndId(over?.id?.toString() || ''))
      },
    })

    const sourcePath = activeItem || ''
    const targetPath = overFolder || ''

    const isFile = sourcePath.endsWith('.md')
    const displayName = getDisplayName(sourcePath.split('/').pop() || '')
    const targetFolder = targetPath.split('/').pop() || ''

    const isMainFolder =
      targetPath.endsWith(HOME_FOLDER_KEY) || targetPath === currentDocsDir
    const keepInCurrentFolder = currentFolderPath
      ? currentFolderPath === targetPath
      : isMainFolder

    return createPortal(
      <DragOverlay
        modifiers={[restrictToWindowEdges]}
        dropAnimation={{ duration: 0 }}
        className={cn('z-[10000] animate-opacity-in transform-gpu', className)}
      >
        <div
          className={cn(
            'bg-black/70 dark:bg-black/40 text-white backdrop-blur-xl dark:border border-border px-2 py-1.5 text-sm rounded-md w-max max-w-xs flex flex-col gap-0.5 [&_svg]:size-3 [&_svg]:shrink-0',
            tooltipClassName,
          )}
        >
          <div className="flex flex-row gap-1.5 items-center">
            {isFile ? <File /> : <FolderClosed />}
            <span className="font-medium whitespace-nowrap">{displayName}</span>
          </div>

          <div className="text-white/80 dark:text-muted-foreground">
            {keepInCurrentFolder ? (
              <span>Keep in the current folder</span>
            ) : isMainFolder ? (
              <span>Move into the main folder</span>
            ) : targetFolder ? (
              <span>
                Move into &quot;
                <span className="break-words">{targetFolder}</span>&quot;
              </span>
            ) : (
              <span>Drag over a folder</span>
            )}
          </div>
        </div>
      </DragOverlay>,
      document.body,
    )
  },
)

DragOverlayTooltip.displayName = 'DragOverlayTooltip'

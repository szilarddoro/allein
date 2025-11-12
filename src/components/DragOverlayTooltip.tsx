import { File, FolderClosed } from 'lucide-react'
import { getDisplayName } from '@/lib/files/fileUtils'
import { DragOverlay } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

export interface DragOverlayTooltipProps {
  activeItem: string
  targetFolder: string
  isActiveFile: boolean
  dragMessage?: string
  targetMessage?: string
  className?: string
  tooltipClassName?: string
}

export function DragOverlayTooltip({
  activeItem,
  targetFolder,
  isActiveFile,
  dragMessage = 'Move into',
  targetMessage = 'Drag over the browser',
  className,
  tooltipClassName,
}: DragOverlayTooltipProps) {
  const displayName = getDisplayName(activeItem.split('/').pop() || '')

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

        {targetFolder ? (
          <div className="text-white/80 dark:text-muted-foreground">
            {dragMessage} <span className="break-words">{targetFolder}</span>
          </div>
        ) : (
          <div className="text-white/80 dark:text-muted-foreground">
            {targetMessage}
          </div>
        )}
      </div>
    </DragOverlay>,
    document.body,
  )
}

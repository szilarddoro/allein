import { Hotkey } from '@/components/Hotkey'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, WandSparkles } from 'lucide-react'
import { RefObject } from 'react'

export interface FloatingActionToolbarProps {
  className?: string
  showPreview?: boolean
  onFormatDocument?: () => void
  onTogglePreview?: () => void
  previewButtonRef: RefObject<HTMLButtonElement | null>
}

export function FloatingActionToolbar({
  className,
  showPreview,
  previewButtonRef,
  onTogglePreview,
  onFormatDocument,
}: FloatingActionToolbarProps) {
  return (
    <div className={cn('group', className)}>
      <div
        className={cn(
          'flex flex-row gap-1',
          'bg-secondary border-1 border-input/60 rounded-lg p-1 motion-safe:transition-opacity opacity-0',
          'group-hover:opacity-100 group-focus:opacity-100 focus-within:opacity-100',
        )}
      >
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onFormatDocument}>
              <WandSparkles className="size-4" />
            </Button>
          </TooltipTrigger>

          <TooltipContent align="center" side="top" sideOffset={10}>
            Format document <Hotkey modifiers={['meta', 'shift']} keyCode="F" />
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePreview}
              ref={previewButtonRef}
            >
              {showPreview ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent align="center" side="top" sideOffset={10}>
            <span className="sr-only">
              {showPreview
                ? 'Preview visible. Click to hide.'
                : 'Preview hidden. Click to show.'}
            </span>
            <span aria-hidden="true">
              {showPreview ? 'Hide preview' : 'Show preview'}
            </span>{' '}
            <Hotkey modifiers={['meta']} keyCode="P" />
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

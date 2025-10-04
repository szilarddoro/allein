import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FileContent } from '@/lib/files/types'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'
import { forwardRef } from 'react'
import { FileNameEditor } from './FileNameEditor'

export interface EditorHeaderProps {
  currentFile: FileContent | null
  showPreview: boolean
  showSidebar: boolean
  onTogglePreview: () => void
  onFileRenamed: (newPath: string) => void
}

/**
 * Header component for the editor page.
 * Contains the file name editor and preview toggle button.
 */
export const EditorHeader = forwardRef<HTMLButtonElement, EditorHeaderProps>(
  (
    { currentFile, showPreview, showSidebar, onTogglePreview, onFileRenamed },
    ref,
  ) => {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-2 pl-4 pr-6 py-1 grow-0 shrink-0',
          !showSidebar && 'pl-6',
        )}
      >
        <FileNameEditor
          currentFile={currentFile}
          onFileRenamed={onFileRenamed}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePreview}
              ref={ref}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent align="center" side="left">
            <span className="sr-only">
              {showPreview
                ? 'Preview visible. Click to hide.'
                : 'Preview hidden. Click to show.'}
            </span>
            <span aria-hidden="true">
              {showPreview ? 'Hide preview' : 'Show preview'}
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  },
)

EditorHeader.displayName = 'EditorHeader'

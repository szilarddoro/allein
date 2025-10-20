import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FileContent } from '@/lib/files/types'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, WandSparkles } from 'lucide-react'
import { forwardRef } from 'react'
import { FileNameEditor } from './FileNameEditor'
import { ActivityIndicator } from '@/components/ActivityIndicator'

export interface EditorHeaderProps {
  currentFile: FileContent | null
  showPreview: boolean
  sidebarOpen: boolean
  inlineCompletionLoading?: boolean
  onTogglePreview: () => void
  onFormatDocument: () => void
  onFileRenamed: (newPath: string) => void
}

/**
 * Header component for the editor page.
 * Contains the file name editor and preview toggle button.
 */
export const EditorHeader = forwardRef<HTMLButtonElement, EditorHeaderProps>(
  (
    {
      currentFile,
      showPreview,
      sidebarOpen,
      inlineCompletionLoading,
      onTogglePreview,
      onFormatDocument,
      onFileRenamed,
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-2 pl-4 pr-6 py-1 grow-0 shrink-0',
          !sidebarOpen && 'pl-6',
        )}
      >
        <FileNameEditor
          currentFile={currentFile}
          onFileRenamed={onFileRenamed}
        />

        <div className="flex items-center gap-1">
          {import.meta.env.DEV && (
            <div
              className={cn(
                'size-9 flex items-center justify-center motion-safe:transition-opacity opacity-0',
                inlineCompletionLoading && 'opacity-100',
              )}
            >
              <ActivityIndicator srOnly>
                Inline completion loading
              </ActivityIndicator>
            </div>
          )}

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onFormatDocument}>
                <WandSparkles className="size-4" />
              </Button>
            </TooltipTrigger>

            <TooltipContent align="center" side="bottom">
              Format document
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePreview}
                ref={ref}
              >
                {showPreview ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent align="end" side="bottom">
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
      </div>
    )
  },
)

EditorHeader.displayName = 'EditorHeader'

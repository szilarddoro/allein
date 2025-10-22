import { ActivityIndicator } from '@/components/ActivityIndicator'
import { FileContent } from '@/lib/files/types'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { FileNameEditor } from './FileNameEditor'

export interface EditorHeaderProps {
  currentFile: FileContent | null
  sidebarOpen: boolean
  inlineCompletionLoading?: boolean
  onFileRenamed: (newPath: string) => void
}

const INDICATOR_VISIBILITY_DELAY = 750

/**
 * Header component for the editor page.
 * Contains the file name editor and preview toggle button.
 */
export function EditorHeader({
  currentFile,
  sidebarOpen,
  inlineCompletionLoading,
  onFileRenamed,
}: EditorHeaderProps) {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    if (!inlineCompletionLoading) {
      setShowIndicator(false)
      return
    }

    const timeout = setTimeout(() => {
      setShowIndicator(true)
    }, INDICATOR_VISIBILITY_DELAY)

    return () => clearTimeout(timeout)
  }, [inlineCompletionLoading])

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 pl-4 pr-6 py-1 grow-0 shrink-0',
        !sidebarOpen && 'pl-6',
      )}
    >
      <FileNameEditor currentFile={currentFile} onFileRenamed={onFileRenamed} />

      <div className="flex items-center gap-1">
        <div
          className={cn(
            'size-9 flex items-center justify-center motion-safe:transition-opacity opacity-0',
            showIndicator && 'opacity-100',
          )}
        >
          <ActivityIndicator srOnly>
            Inline completion loading
          </ActivityIndicator>
        </div>
      </div>
    </div>
  )
}

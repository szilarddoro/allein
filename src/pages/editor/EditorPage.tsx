import React, { useRef, useState, useEffect } from 'react'
import { TextEditor } from './TextEditor'
import MarkdownPreview from './MarkdownPreview'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import * as monaco from 'monaco-editor'
import { useDebounceCallback, useOnClickOutside } from 'usehooks-ts'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/lib/useToast'
import { sanitizeFileName } from '@/lib/files/validation'
import { useWriteFile } from '@/lib/files/useWriteFile'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useReadFile } from '@/lib/files/useReadFile'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'

const AUTO_SAVE_DELAY = 2000

export function EditorPage() {
  const { toast } = useToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedRenameRef = useRef<ReturnType<
    typeof useDebounceCallback<typeof handleRename>
  > | null>(null)

  const { mutateAsync: writeFile } = useWriteFile()
  const { mutateAsync: renameFile } = useRenameFile()
  const currentFilePath = useCurrentFilePath()
  const { data: currentFile } = useReadFile(currentFilePath)
  const [fileName, setFileName] = useState(
    currentFilePath.split('/').pop() || '',
  )

  // Sync content when current file changes
  useEffect(() => {
    if (currentFile) {
      setMarkdownContent(currentFile.content)
    } else {
      setMarkdownContent('')
    }
  }, [currentFile])

  useEffect(() => {
    if (currentFilePath) {
      setFileName(currentFilePath.split('/').pop() || '')
    }
  }, [currentFilePath])

  // Auto-save functionality
  const handleEditorChange = (content: string) => {
    setMarkdownContent(content)

    // TODO: Replace this with a debounced function
    if (currentFile) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await writeFile({ filePath: currentFile.path, content })
        } catch {
          toast.error('Failed to save file')
        }
      }, AUTO_SAVE_DELAY)
    }
  }

  useHotkeys(
    ['ctrl+i', 'meta+i'],
    () => {
      setShowPreview(!showPreview)
    },
    { preventDefault: true },
  )

  const handleKeyDown = (event: monaco.IKeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.keyCode === monaco.KeyCode.KeyS
    ) {
      event.preventDefault()
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.keyCode === monaco.KeyCode.Escape
    ) {
      previewButtonRef.current?.focus()
    }
  }

  useOnClickOutside(editorRef as React.RefObject<HTMLElement>, () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  async function handleRename(newName: string) {
    if (!currentFile) {
      return
    }

    try {
      await renameFile({ oldPath: currentFile.path, newName })
    } catch {
      toast.error('Failed to rename file')
    }
  }

  const debouncedHandleRename = useDebounceCallback(handleRename, 500)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { sanitized: sanitizedFileName } = sanitizeFileName(
      event.target.value,
    )

    setFileName(sanitizedFileName)

    debouncedRenameRef.current?.cancel()
    debouncedRenameRef.current = debouncedHandleRename
    debouncedRenameRef.current?.(sanitizedFileName)
  }

  // Show empty state when no file is selected
  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            No file selected
          </h2>
          <p className="text-gray-500 mb-4">
            Create a new file or select an existing one from the sidebar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-1 overflow-hidden">
      <div className="flex items-center justify-between gap-2 pl-4 pr-6 py-1 grow-0 shrink-0">
        <div className="flex flex-row items-center gap-2 text-sm text-muted-foreground grow-1 shrink-1 flex-auto">
          <label className="sr-only" htmlFor="file-name">
            File name
          </label>

          <input
            id="file-name"
            value={fileName}
            onChange={handleFileChange}
            className="w-full focus:outline-none"
            maxLength={255}
            spellCheck={false}
            autoCorrect="off"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setShowPreview(!showPreview)
          }}
          ref={previewButtonRef}
        >
          <span className="sr-only">
            {showPreview
              ? 'Preview visible. Click to hide.'
              : 'Preview hidden. Click to show.'}
          </span>

          {showPreview ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="w-full flex flex-auto min-h-0">
        <div
          ref={editorRef}
          className={cn(
            'w-full h-full pl-2 pr-4 pb-4',
            showPreview && 'w-1/2 pr-2',
          )}
        >
          <TextEditor
            value={markdownContent}
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your markdown..."
          />
        </div>

        {showPreview && (
          <div className="w-1/2 pl-2 pr-4 pb-4">
            <MarkdownPreview content={markdownContent} />
          </div>
        )}
      </div>
    </div>
  )
}

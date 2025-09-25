import React, { useRef, useState, useEffect } from 'react'
import { useOutletContext } from 'react-router'
import { TextEditor } from './TextEditor'
import MarkdownPreview from './MarkdownPreview'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import * as monaco from 'monaco-editor'
import { useOnClickOutside } from 'usehooks-ts'
import { FileContent } from '@/lib/files/types'

interface OutletContext {
  showPreview: boolean
  setShowPreview: (showPreview: boolean) => void
  previewButtonRef: React.RefObject<HTMLButtonElement>
  currentFile: FileContent | null
  writeFile: (filePath: string, content: string) => Promise<void>
  setCurrentFile: (file: FileContent | null) => void
}

export function EditorPage() {
  const editorRef = useRef<HTMLDivElement>(null)
  const {
    showPreview,
    setShowPreview,
    previewButtonRef,
    currentFile,
    writeFile,
  } = useOutletContext<OutletContext>()

  const [markdownContent, setMarkdownContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync content when current file changes
  useEffect(() => {
    if (currentFile) {
      setMarkdownContent(currentFile.content)
    } else {
      setMarkdownContent('')
    }
  }, [currentFile])

  // Auto-save functionality
  const handleEditorChange = (content: string) => {
    setMarkdownContent(content)

    if (currentFile) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          await writeFile(currentFile.path, content)
        } catch {
          // Handle save error silently for now
        } finally {
          setIsSaving(false)
        }
      }, 2000) // 2 second debounce
    }
  }

  useHotkeys(
    ['ctrl+i', 'meta+i'],
    () => {
      setShowPreview(!showPreview)
    },
    {
      preventDefault: true,
    },
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
    <div className="h-full flex overflow-hidden">
      <div
        ref={editorRef}
        className={cn('w-full pl-4 pr-4 pb-4', showPreview && 'w-1/2 pr-2')}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {currentFile.path.split('/').pop()}
            {isSaving && <span className="ml-2 text-blue-500">Saving...</span>}
          </span>
        </div>
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
  )
}

import { ActivityIndicator } from '@/components/ActivityIndicator'
import { Button } from '@/components/ui/button'
import { P } from '@/components/ui/typography'
import { getDisplayName, removeMdExtension } from '@/lib/files/fileUtils'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useReadFile } from '@/lib/files/useReadFile'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useWriteFile } from '@/lib/files/useWriteFile'
import { validateFileName } from '@/lib/files/validation'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, RefreshCw, TriangleAlert } from 'lucide-react'
import * as monaco from 'monaco-editor'
import React, { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useOnClickOutside } from 'usehooks-ts'
import MarkdownPreview from './MarkdownPreview'
import { TextEditor } from './TextEditor'
import { useFileList } from '@/lib/files/useFileList'
import { useNavigate } from 'react-router'

const AUTO_SAVE_DELAY = 2000

export function EditorPage() {
  const { toast } = useToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { files } = useFileList()
  const { mutateAsync: writeFile } = useWriteFile()
  const { mutateAsync: renameFile } = useRenameFile()
  const currentFilePath = useCurrentFilePath()
  const navigate = useNavigate()
  const {
    data: currentFile,
    status: currentFileStatus,
    error: currentFileError,
    refetch: refetchCurrentFile,
  } = useReadFile(currentFilePath)
  const [fileName, setFileName] = useState(
    removeMdExtension(currentFilePath.split('/').pop() || ''),
  )
  const [fileNameValidationErrorType, setFileNameValidationErrorType] =
    useState<'invalid' | 'duplicate' | 'none'>('none')
  const fileNameInputRef = useRef<HTMLInputElement>(null)
  const renameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync content when current file changes
  useEffect(() => {
    if (currentFile) {
      setMarkdownContent(currentFile.content)
    } else {
      setMarkdownContent('')
    }
  }, [currentFile])

  useEffect(() => {
    console.log(currentFilePath)
    if (currentFilePath) {
      setFileName(removeMdExtension(currentFilePath.split('/').pop() || ''))
    }
  }, [currentFilePath])

  // Auto-save functionality
  const handleEditorChange = (content: string) => {
    setMarkdownContent(content)

    // TODO: Write the file immediately when navigating to a new file
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

  async function handleFileNameChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const inputValue = event.target.value
    const { isValid } = validateFileName(inputValue)

    if (renameTimeoutRef.current) {
      clearTimeout(renameTimeoutRef.current)
    }

    setFileName(inputValue)

    if (files.some((file) => removeMdExtension(file.name) === inputValue)) {
      setFileNameValidationErrorType('duplicate')
      return
    }

    if (!isValid && inputValue.length > 0) {
      setFileNameValidationErrorType('invalid')
      return
    }

    setFileNameValidationErrorType('none')

    renameTimeoutRef.current = setTimeout(async () => {
      if (inputValue.length > 0) {
        if (!currentFile) {
          return
        }

        try {
          const newName = await renameFile({
            oldPath: currentFile.path,
            newName: inputValue,
          })

          navigate(`/editor?file=${newName}`)
        } catch {
          toast.error('Failed to rename file')
        }
      }
    }, 500)
  }

  if (currentFileStatus === 'pending') {
    return (
      <div className="h-full flex items-center justify-center">
        <ActivityIndicator>Loading file...</ActivityIndicator>
      </div>
    )
  }

  if (currentFileError) {
    return (
      <div className="h-full flex flex-col gap-2 items-center justify-center">
        <P className="text-red-600 text-sm">
          Failed to load file. Please try again.
        </P>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchCurrentFile()}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    )
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
        <div className="relative flex flex-row items-center gap-2 text-sm text-muted-foreground grow-1 shrink-1 flex-auto">
          <label className="sr-only" htmlFor="file-name">
            File name
          </label>

          <input
            ref={fileNameInputRef}
            id="file-name"
            value={fileName}
            onChange={handleFileNameChange}
            className="w-full focus:outline-none"
            maxLength={255}
            spellCheck={false}
            autoCorrect="off"
            aria-invalid={fileNameValidationErrorType !== 'none'}
            aria-describedby="file-name-error"
          />

          {fileNameValidationErrorType !== 'none' && (
            <div
              id="file-name-error"
              className="flex flex-row gap-1 items-center absolute -bottom-1 left-0 translate-y-full rounded-sm border border-yellow-300 bg-yellow-100 text-xs py-1 px-2 text-yellow-700 font-normal z-1000"
            >
              <TriangleAlert className="w-3 h-3" />
              {fileNameValidationErrorType === 'invalid'
                ? 'File name is invalid.'
                : 'File name is already taken.'}
            </div>
          )}
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

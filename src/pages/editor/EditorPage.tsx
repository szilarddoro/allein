import { Button } from '@/components/ui/button'
import { P } from '@/components/ui/typography'
import { removeMdExtension } from '@/lib/files/fileUtils'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useReadFile } from '@/lib/files/useReadFile'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useWriteFile } from '@/lib/files/useWriteFile'
import { validateFileName } from '@/lib/files/validation'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import {
  CircleAlert,
  Eye,
  EyeOff,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import * as monaco from 'monaco-editor'
import React, { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useOnClickOutside } from 'usehooks-ts'
import MarkdownPreview from './MarkdownPreview'
import { TextEditor } from './TextEditor'
import { useFileList } from '@/lib/files/useFileList'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AppLayoutContextProps } from '@/lib/types'
import { useOutletContext } from 'react-router'

const AUTO_SAVE_DELAY = 2000

export function EditorPage() {
  const { showSidebar } = useOutletContext<AppLayoutContextProps>()
  const { toast } = useToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { files } = useFileList()
  const { mutateAsync: writeFile } = useWriteFile()
  const { mutateAsync: renameFile } = useRenameFile()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const {
    data: currentFile,
    status: currentFileStatus,
    error: currentFileError,
    refetch: refetchCurrentFile,
  } = useReadFile(currentFilePath)
  const [fileName, setFileName] = useState('')
  const [fileNameValidationErrorType, setFileNameValidationErrorType] =
    useState<'invalid' | 'duplicate' | 'none'>('none')
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const fileNameInputRef = useRef<HTMLInputElement>(null)

  // Sync content when current file changes
  useEffect(() => {
    if (currentFile) {
      setMarkdownContent(currentFile.content)
      setFileName(removeMdExtension(currentFile.name))
    } else {
      setMarkdownContent('')
      setFileName('')
    }
  }, [currentFile])

  // Focus input when editing mode is enabled
  useEffect(() => {
    if (isEditingFileName && fileNameInputRef.current) {
      fileNameInputRef.current.focus()
      fileNameInputRef.current.select()
    }
  }, [isEditingFileName])

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
      toast.info('The file is being saved automatically.')
    }

    if (event.ctrlKey && event.keyCode === monaco.KeyCode.Escape) {
      previewButtonRef.current?.focus()
    }
  }

  useOnClickOutside(editorRef as React.RefObject<HTMLElement>, () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  function handleFileNameClick() {
    setIsEditingFileName(true)
    setFileNameValidationErrorType('none')
  }

  function handleFileNameKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      handleFileNameBlur()
    } else if (event.key === 'Escape') {
      // Reset to original name first
      if (currentFile) {
        setFileName(removeMdExtension(currentFile.name))
      }
      setFileNameValidationErrorType('none')
      setIsEditingFileName(false)
    }
  }

  async function handleFileNameBlur() {
    if (!currentFile) return

    const inputValue = fileName.trim()
    const { isValid } = validateFileName(inputValue)

    if (!isValid) {
      setFileNameValidationErrorType('invalid')
      return
    }

    if (
      files.some(
        (file) =>
          removeMdExtension(file.name) === inputValue &&
          file.path !== currentFile?.path,
      )
    ) {
      setFileNameValidationErrorType('duplicate')
      return
    }

    setFileNameValidationErrorType('none')
    setIsEditingFileName(false)

    if (
      inputValue.length === 0 ||
      inputValue === removeMdExtension(currentFile.name)
    ) {
      return
    }

    try {
      const newName = await renameFile({
        oldPath: currentFile.path,
        newName: inputValue,
      })

      updateCurrentFilePath(newName)
      toast.success('File renamed successfully')
    } catch {
      toast.error('Failed to rename file')
    }
  }

  function handleFileNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.value)
    setFileNameValidationErrorType('none')
  }

  if (currentFileError) {
    return (
      <div className="h-full flex flex-col gap-2 items-center justify-center">
        <P className="flex flex-row gap-1 items-center text-red-600 text-sm">
          <CircleAlert className="w-4 h-4" />
          Failed to load file. It might have been moved or deleted.
        </P>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchCurrentFile()}
        >
          <RefreshCw className="w-4 h-4" />
          Reload file
        </Button>
      </div>
    )
  }

  // Show empty state when no file is selected
  if (!currentFilePath) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-600 mb-2">
            No file selected
          </h2>
          <p className="text-zinc-500 mb-4">
            Create a new file or select an existing one from the sidebar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-1 overflow-hidden">
      <div
        className={cn(
          'flex items-center justify-between gap-2 pl-4 pr-6 py-1 grow-0 shrink-0',
          !showSidebar && 'pl-6',
        )}
      >
        <div className="relative flex flex-row items-center gap-2 text-sm text-muted-foreground grow-1 shrink-1 flex-auto">
          {isEditingFileName ? (
            <>
              <label className="sr-only" htmlFor="file-name">
                File name
              </label>

              <input
                ref={fileNameInputRef}
                id="file-name"
                value={fileName}
                onChange={handleFileNameChange}
                onBlur={handleFileNameBlur}
                onKeyDown={handleFileNameKeyDown}
                className="w-full focus:outline-none"
                maxLength={255}
                spellCheck={false}
                autoCorrect="off"
                aria-invalid={fileNameValidationErrorType !== 'none'}
                aria-describedby="file-name-error"
                aria-label="File name"
                autoFocus
              />

              {fileNameValidationErrorType !== 'none' && (
                <div
                  id="file-name-error"
                  className="flex flex-row gap-1 items-center absolute -bottom-1 left-0 translate-y-full rounded-sm border border-yellow-300 bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-600 text-xs py-1 px-2 text-yellow-700 dark:text-yellow-300 font-normal z-1000"
                >
                  <TriangleAlert className="w-3 h-3" />
                  {fileNameValidationErrorType === 'invalid'
                    ? 'File name is invalid.'
                    : 'File name is already taken.'}
                </div>
              )}
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger
                asChild
                className="cursor-default hover:text-foreground transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring/50 rounded"
                onClick={handleFileNameClick}
              >
                <button onClick={handleFileNameClick} className="text-left">
                  {fileName}
                </button>
              </TooltipTrigger>

              <TooltipContent align="center" side="right">
                Click to edit file name
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowPreview(!showPreview)
              }}
              ref={previewButtonRef}
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

      <div className="w-full flex flex-auto min-h-0">
        <div
          ref={editorRef}
          className={cn(
            'w-full h-full pl-2 pr-4 pb-4',
            showPreview && 'w-1/2 pr-2',
            !showSidebar && 'pl-4',
          )}
        >
          <TextEditor
            value={markdownContent}
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            placeholder={
              currentFileStatus === 'pending' ? '' : 'Start writing...'
            }
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

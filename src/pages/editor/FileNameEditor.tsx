import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { removeMdExtension } from '@/lib/files/fileUtils'
import { FileContent } from '@/lib/files/types'
import { useFileList } from '@/lib/files/useFileList'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { validateFileName } from '@/lib/files/validation'
import { useToast } from '@/lib/useToast'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { Copy, TriangleAlert } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export interface FileNameEditorProps {
  currentFile: FileContent | null
  onFileRenamed: (newPath: string) => void
}

/**
 * Inline file name editor with validation.
 * Allows users to click and edit the file name with real-time validation.
 */
export function FileNameEditor({
  currentFile,
  onFileRenamed,
}: FileNameEditorProps) {
  const { toast } = useToast()
  const { data: files } = useFileList()
  const { mutateAsync: renameFile } = useRenameFile()
  const [fileName, setFileName] = useState('')
  const [fileNameValidationErrorType, setFileNameValidationErrorType] =
    useState<'invalid' | 'duplicate' | 'none'>('none')
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const fileNameInputRef = useRef<HTMLInputElement>(null)

  // Sync file name when current file changes
  useEffect(() => {
    if (currentFile) {
      setFileName(removeMdExtension(currentFile.name))
    } else {
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
      files?.some(
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

      onFileRenamed(newName)
      toast.success('File renamed successfully')
    } catch {
      toast.error('Failed to rename file')
    }
  }

  function handleFileNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.value)
    setFileNameValidationErrorType('none')
  }

  async function handleCopyFilePath() {
    if (!currentFile) return

    try {
      await writeText(currentFile.path)
      toast.success('File path copied to clipboard')
    } catch {
      toast.error('Failed to copy file path')
    }
  }

  return (
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
          <ContextMenu>
            <TooltipTrigger
              asChild
              className="cursor-pointer hover:text-foreground transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring/50 rounded"
            >
              <ContextMenuTrigger asChild>
                <button
                  onClick={handleFileNameClick}
                  onContextMenu={(e) => e.stopPropagation()}
                  className="text-left select-none"
                >
                  {fileName}
                </button>
              </ContextMenuTrigger>
            </TooltipTrigger>

            <ContextMenuContent className="w-48" loop>
              <ContextMenuItem onClick={handleCopyFilePath}>
                <Copy className="w-4 h-4 mr-2 text-current" />
                Copy path
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          <TooltipContent align="center" side="bottom">
            Click to edit file name
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { removeMdExtension } from '@/lib/files/fileUtils'
import { FileContent } from '@/lib/files/types'
import {
  useFilesAndFolders,
  flattenTreeItems,
} from '@/lib/files/useFilesAndFolders'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { validateFileName } from '@/lib/files/validation'
import { useToast } from '@/lib/useToast'
import { useFileNameContextMenu } from '@/pages/editor/useFileNameContextMenu'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { TriangleAlert } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export interface FileNameEditorProps {
  currentFile: FileContent | null
  onFileRenamed: (newPath: string, oldPath: string) => void
  sidebarOpen: boolean
}

/**
 * Inline file name editor with validation.
 * Allows users to click and edit the file name with real-time validation.
 */
export function FileNameEditor({
  currentFile,
  onFileRenamed,
  sidebarOpen,
}: FileNameEditorProps) {
  const { toast } = useToast()
  const { data } = useFilesAndFolders()
  const files = flattenTreeItems(data)
  const { mutateAsync: renameFile } = useRenameFile()
  const { showContextMenu } = useFileNameContextMenu()
  const [fileName, setFileName] = useState('')
  const [fileNameValidationErrorType, setFileNameValidationErrorType] =
    useState<
      ReturnType<typeof validateFileName>['error'] | 'duplicate' | 'none'
    >('none')
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
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

  function getErrorMessage() {
    switch (fileNameValidationErrorType) {
      case 'empty':
        return 'File name cannot be empty'
      case 'too-long':
        return 'File name is too long (max 255 characters)'
      case 'control-characters':
        return 'File name contains control characters'
      case 'duplicate':
        return 'File name is already taken'
      case 'invalid-leading-trailing':
        return 'File name cannot start or end with spaces or dots'
      case 'reserved':
        return 'File name is reserved by the operating system'
      case 'invalid':
        return 'File name contains invalid characters: < > : " / \\ | ? *'
      case 'consecutive-dots':
        return 'File name cannot contain consecutive dots'
      default:
        return ''
    }
  }

  function handleFileNameClick() {
    setIsEditingFileName(true)
    setFileNameValidationErrorType('none')
  }

  function handleFileNameKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      ;(event.target as HTMLInputElement).select()
    }

    if (event.key === 'Enter') {
      handleFileNameBlur()
    }

    if (event.key === 'Escape') {
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

    if (
      inputValue.length === 0 ||
      inputValue === removeMdExtension(currentFile.name)
    ) {
      setFileNameValidationErrorType('none')
      setIsEditingFileName(false)
      return
    }

    try {
      const oldPath = currentFile.path
      const newPath = await renameFile({
        oldPath,
        newName: inputValue,
        existingFiles: files || [],
      })

      setFileNameValidationErrorType('none')
      setIsEditingFileName(false)
      onFileRenamed(newPath, oldPath)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to rename file'

      // Map error messages to validation error types for UI display
      if (errorMessage.includes('already exists')) {
        requestAnimationFrame(() => {
          fileNameInputRef.current?.focus()
          fileNameInputRef.current?.select()
        })
        setFileNameValidationErrorType('duplicate')
      } else if (errorMessage.includes('empty')) {
        setFileNameValidationErrorType('empty')
      } else if (errorMessage.includes('too long')) {
        setFileNameValidationErrorType('too-long')
      } else if (errorMessage.includes('invalid characters')) {
        setFileNameValidationErrorType('invalid')
      } else if (errorMessage.includes('reserved')) {
        setFileNameValidationErrorType('reserved')
      } else if (errorMessage.includes('start or end')) {
        setFileNameValidationErrorType('invalid-leading-trailing')
      } else if (errorMessage.includes('consecutive dots')) {
        setFileNameValidationErrorType('consecutive-dots')
      } else if (errorMessage.includes('control characters')) {
        setFileNameValidationErrorType('control-characters')
      } else {
        toast.error(errorMessage)
      }
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
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy file path')
    }
  }

  async function handleOpenInFolder() {
    if (!currentFile) return

    try {
      await revealItemInDir(currentFile.path)
    } catch {
      toast.error('Failed to open in folder')
    }
  }

  return (
    <div className="relative flex flex-row items-center gap-2 text-sm text-muted-foreground grow-1 shrink-1 flex-auto ml-1">
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
            className="w-full focus:outline-none px-1.5 py-0.5"
            maxLength={255}
            spellCheck={false}
            autoCorrect="off"
            aria-invalid={fileNameValidationErrorType !== 'none'}
            aria-describedby="file-name-error"
            aria-label="File name"
            autoFocus
          />

          {fileNameValidationErrorType &&
            fileNameValidationErrorType !== 'none' && (
              <div
                id="file-name-error"
                className="flex flex-row gap-1 items-center absolute -bottom-1 left-0 translate-y-full rounded-sm border border-yellow-300 bg-yellow-100 dark:bg-yellow-950 dark:border-yellow-700 text-xs py-1 px-2 text-yellow-700 dark:text-yellow-400 font-normal z-1000"
              >
                <TriangleAlert className="w-3 h-3" />
                {getErrorMessage()}
              </div>
            )}
        </>
      ) : (
        <Tooltip
          delayDuration={500}
          open={tooltipOpen}
          onOpenChange={setTooltipOpen}
        >
          <TooltipTrigger
            asChild
            className="cursor-pointer hover:text-foreground transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring/50 rounded"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileNameClick}
              onContextMenu={(e) => {
                setTooltipOpen(false)
                showContextMenu(e, {
                  onCopyPath: handleCopyFilePath,
                  onOpenInFolder: handleOpenInFolder,
                })
              }}
              className="text-left px-1.5 py-0.5 h-auto font-normal rounded-md"
            >
              {fileName}
            </Button>
          </TooltipTrigger>

          <TooltipContent
            align={sidebarOpen ? 'center' : 'start'}
            side="bottom"
          >
            Click to edit file name
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

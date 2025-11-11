import { AlertText } from '@/components/AlertText'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getDisplayName } from '@/lib/files/fileUtils'
import { FileContent } from '@/lib/files/types'
import {
  flattenTreeItems,
  useFilesAndFolders,
} from '@/lib/files/useFilesAndFolders'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useToast } from '@/lib/useToast'
import { useFileNameContextMenu } from '@/pages/editor/useFileNameContextMenu'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
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
  const {
    error,
    mutateAsync: renameFile,
    reset: resetRenameState,
  } = useRenameFile()
  const { showContextMenu } = useFileNameContextMenu()
  const [fileName, setFileName] = useState('')
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const fileNameInputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Sync file name when current file changes
  useEffect(() => {
    if (currentFile) {
      setFileName(getDisplayName(currentFile.name))
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
        setFileName(getDisplayName(currentFile.name))
      }
      setIsEditingFileName(false)
    }
  }

  async function handleFileNameBlur() {
    if (!currentFile) return

    const inputValue = fileName.trim()

    if (
      inputValue.length === 0 ||
      inputValue === getDisplayName(currentFile.name)
    ) {
      setIsEditingFileName(false)
      resetRenameState()
      return
    }

    const oldPath = currentFile.path

    try {
      const { newPath } = await renameFile({
        oldPath,
        newName: inputValue,
        existingFiles: files || [],
      })

      setIsEditingFileName(false)
      onFileRenamed(newPath, oldPath)
      resetRenameState()

      requestAnimationFrame(() => {
        buttonRef.current?.focus()
      })
    } catch {
      // We're rendering the error on the UI
    }
  }

  function handleFileNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.value)
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
          <input
            ref={fileNameInputRef}
            id="file-name"
            value={fileName}
            onChange={handleFileNameChange}
            onBlur={handleFileNameBlur}
            onKeyDown={handleFileNameKeyDown}
            placeholder={getDisplayName(currentFile?.name || '')}
            className="w-full focus:outline-none px-1.5 py-0.5 min-w-11"
            maxLength={255}
            spellCheck={false}
            autoCorrect="off"
            aria-invalid={error != null}
            aria-describedby="file-name-error"
            aria-label="Edit file name"
            autoFocus
          />

          {error && (
            <AlertText
              id="file-name-error"
              className="absolute -bottom-1 left-0 translate-y-full z-1000"
            >
              {error.message}
            </AlertText>
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
              ref={buttonRef}
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

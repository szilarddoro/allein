import { AlertText } from '@/components/AlertText'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FOCUS_NAME_INPUT } from '@/lib/constants'
import { getDisplayName } from '@/lib/files/fileUtils'
import { FileContent } from '@/lib/files/types'
import {
  flattenTreeItems,
  useFilesAndFolders,
} from '@/lib/files/useFilesAndFolders'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useToast } from '@/lib/useToast'
import { useFileNameContextMenu } from '@/pages/editor/useFileNameContextMenu'
import { useMonaco } from '@monaco-editor/react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

export interface FileNameEditorProps {
  currentFile: FileContent | null
  onFileRenamed: (newPath: string, oldPath: string) => void
  sidebarOpen: boolean
  editorReady: boolean
}

/**
 * Inline file name editor with validation.
 * Allows users to click and edit the file name with real-time validation.
 */
export function FileNameEditor({
  currentFile,
  onFileRenamed,
  sidebarOpen,
  editorReady,
}: FileNameEditorProps) {
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const monaco = useMonaco()

  // Sync file name when current file changes
  useEffect(() => {
    if (currentFile) {
      setFileName(getDisplayName(currentFile.name))
    } else {
      setFileName('')
    }
  }, [currentFile])

  useEffect(() => {
    if (!editorReady) {
      return
    }

    if (searchParams.get(FOCUS_NAME_INPUT) === 'true') {
      setEditing(true)
      requestAnimationFrame(() => {
        const input = inputRef.current

        if (input) {
          input.focus()
          input.select()
        }
      })
    } else {
      requestAnimationFrame(() => {
        const [editor] = monaco?.editor?.getEditors() || []

        if (editor) {
          editor.focus()
        }
      })
    }
  }, [editorReady, monaco, searchParams, setSearchParams])

  // Focus input when editing mode is enabled

  function handleFileNameKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      ;(event.target as HTMLInputElement).select()
    }

    if (event.key === 'Enter') {
      handleFileNameBlur(null, 'enter')
    }

    if (event.key === 'Escape') {
      // Reset to original name first
      if (currentFile) {
        setFileName(getDisplayName(currentFile.name))
      }
      setEditing(false)
    }
  }

  async function handleFileNameBlur(
    _ev: React.FocusEvent<HTMLInputElement> | null,
    trigger?: 'enter' | 'tab',
  ) {
    if (!currentFile) return

    const inputValue = fileName.trim()

    if (inputValue === getDisplayName(currentFile.name)) {
      setEditing(false)
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

      setEditing(false)
      onFileRenamed(newPath, oldPath)
      resetRenameState()

      if (trigger === 'enter') {
        requestAnimationFrame(() => {
          buttonRef.current?.focus()
        })
      }
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
      {editing ? (
        <>
          <input
            ref={inputRef}
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
              onClick={() => setEditing(true)}
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

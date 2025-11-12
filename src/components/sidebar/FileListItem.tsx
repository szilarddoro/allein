import { DraggableListItem } from '@/components/sidebar/DraggableListItem'
import { ItemRenameInput } from '@/components/sidebar/ItemRenameInput'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useDraggingActive } from '@/lib/dnd/useDraggingActive'
import { getDisplayName } from '@/lib/files/fileUtils'
import { FileInfo } from '@/lib/files/types'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import {
  flattenTreeItemsWithType,
  useFilesAndFolders,
} from '@/lib/files/useFilesAndFolders'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'

export interface FileListItemProps {
  file: FileInfo
  className?: string
  isDeletingFile?: boolean
  onDelete: (path: string, name: string, type: 'file' | 'folder') => void
  editing: boolean
  onStartEdit: (filePath: string) => void
  onCancelEdit: () => void
}

export function FileListItem({
  file,
  className,
  isDeletingFile = false,
  onDelete,
  editing,
  onStartEdit,
  onCancelEdit,
}: FileListItemProps) {
  const draggingActive = useDraggingActive()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const { showContextMenu } = useFileContextMenu()
  const { toast } = useToast()
  const navigate = useNavigate()
  const friendlyFileName = getDisplayName(file.name)
  const {
    error: renameError,
    mutateAsync: renameFile,
    reset: resetRenameState,
  } = useRenameFile()
  const { data: filesAndFolders } = useFilesAndFolders()
  const existingFiles = flattenTreeItemsWithType(filesAndFolders)
  const { removeEntriesForFile } = useLocationHistory()

  async function handleCopyFilePath(filePath: string) {
    try {
      await writeText(filePath)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy file path')
    }
  }

  async function handleOpenInFolder(filePath: string) {
    try {
      await revealItemInDir(filePath)
    } catch {
      toast.error('Failed to open in folder')
    }
  }

  const handleSubmitNewName = useCallback(
    async (newName: string) => {
      if (newName.trim() === friendlyFileName) {
        onCancelEdit()
        resetRenameState()
        return
      }

      try {
        const oldPath = file.path
        const { newPath } = await renameFile({
          oldPath: file.path,
          newName,
          existingFiles,
          itemType: 'file',
        })
        onCancelEdit()
        resetRenameState()

        if (oldPath) {
          removeEntriesForFile(oldPath)
        }

        // Only update current file path if we're currently editing this file
        if (currentFilePath === oldPath) {
          updateCurrentFilePath(newPath)
        }
      } catch {
        // We're rendering the error on the UI
      }
    },
    [
      friendlyFileName,
      resetRenameState,
      file.path,
      renameFile,
      existingFiles,
      updateCurrentFilePath,
      removeEntriesForFile,
      onCancelEdit,
      currentFilePath,
    ],
  )

  useEffect(() => {
    if (!editing) {
      resetRenameState()
    }
  }, [editing, resetRenameState])

  function handleCancelNameEditing() {
    onCancelEdit()
    resetRenameState()
  }

  if (editing) {
    return (
      <li className="w-full">
        <ItemRenameInput
          itemName={friendlyFileName}
          onSubmit={handleSubmitNewName}
          onCancel={handleCancelNameEditing}
          editing={editing}
          error={renameError}
        />
      </li>
    )
  }

  return (
    <DraggableListItem id={encodeURIComponent(file.path)}>
      <Button asChild variant="ghost" size="sm" className="w-full">
        <Link
          viewTransition
          to={{
            pathname: '/editor',
            search: `?file=${encodeURIComponent(file.path)}`,
          }}
          aria-current={currentFilePath === file.path}
          className={cn(
            'group flex items-center gap-2 p-2 rounded-md cursor-default transition-colors',
            !draggingActive
              ? currentFilePath === file.path
                ? 'bg-neutral-200/60 hover:bg-neutral-200/90 dark:bg-neutral-700/60 dark:hover:bg-neutral-700/90'
                : 'hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40'
              : 'pointer-events-none hover:!bg-transparent',
            className,
          )}
          onContextMenu={(e) =>
            showContextMenu(e, {
              filePath: file.path,
              fileName: file.name,
              onOpen: () =>
                navigate({
                  pathname: '/editor',
                  search: `?file=${encodeURIComponent(file.path)}`,
                }),
              onCopyPath: () => handleCopyFilePath(file.path),
              onOpenInFolder: () => handleOpenInFolder(file.path),
              onDelete: () => onDelete(file.path, file.name, 'file'),
              onRename: () => onStartEdit(file.path),
              isDeletingFile,
            })
          }
        >
          <span aria-hidden="true" className="flex-1 text-sm truncate">
            {friendlyFileName}
          </span>

          <span className="sr-only">Open file {friendlyFileName}</span>
        </Link>
      </Button>
    </DraggableListItem>
  )
}

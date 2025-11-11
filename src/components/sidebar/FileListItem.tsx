import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { getDisplayName } from '@/lib/files/fileUtils'
import { FileInfo } from '@/lib/files/types'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { useNavigate } from 'react-router'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useCallback, useEffect, useState } from 'react'
import { ItemRenameInput } from '@/components/sidebar/ItemRenameInput'
import { useRenameFile } from '@/lib/files/useRenameFile'
import {
  useFilesAndFolders,
  flattenTreeItems,
} from '@/lib/files/useFilesAndFolders'

export interface FileListItemProps {
  file: FileInfo
  className?: string
  isDeletingFile?: boolean
  onDelete: (path: string, name: string, type: 'file' | 'folder') => void
  editing?: boolean
}

export function FileListItem({
  file,
  className,
  isDeletingFile = false,
  onDelete,
  editing: externalEditing = false,
}: FileListItemProps) {
  const [editing, setEditing] = useState(false)
  const [currentFilePath] = useCurrentFilePath()
  const { showContextMenu } = useFileContextMenu()
  const { toast } = useToast()
  const navigate = useNavigate()
  const friendlyFileName = getDisplayName(file.name)
  const { error: renameError, mutateAsync: renameFile, reset } = useRenameFile()
  const { data: filesAndFolders } = useFilesAndFolders()
  const existingFiles = flattenTreeItems(filesAndFolders)

  useEffect(() => {
    setEditing(externalEditing)
  }, [externalEditing])

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

  function handleStartRename() {
    setEditing(true)
  }

  const handleSubmitNewName = useCallback(
    async (newName: string) => {
      if (newName.trim() === friendlyFileName) {
        setEditing(false)
        reset()
        return
      }

      try {
        await renameFile({ oldPath: file.path, newName, existingFiles })
        setEditing(false)
        reset()
      } catch {
        // We're rendering the error on the UI
      }
    },
    [friendlyFileName, renameFile, file.path, existingFiles, reset],
  )

  if (editing) {
    return (
      <li className="w-full">
        <ItemRenameInput
          itemName={friendlyFileName}
          onSubmit={handleSubmitNewName}
          onCancel={() => setEditing(false)}
          error={renameError}
        />
      </li>
    )
  }

  return (
    <li className="w-full">
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
            currentFilePath === file.path
              ? 'bg-neutral-200/60 hover:bg-neutral-200/90 dark:bg-neutral-700/60 dark:hover:bg-neutral-700/90'
              : 'hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40',
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
              onRename: handleStartRename,
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
    </li>
  )
}

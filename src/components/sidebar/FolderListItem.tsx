import { FileListItem } from '@/components/sidebar/FileListItem'
import { ItemRenameInput } from '@/components/sidebar/ItemRenameInput'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TreeItem } from '@/lib/files/types'
import { useFolderContextMenu } from '@/lib/folders/useFolderContextMenu'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useRenameFile } from '@/lib/files/useRenameFile'
import {
  useFilesAndFolders,
  flattenTreeItems,
} from '@/lib/files/useFilesAndFolders'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'

export interface FolderListItemProps {
  folder: TreeItem
  isDeletingFile?: boolean
  onDelete: (path: string, name: string, type: 'file' | 'folder') => void
  onRename: (path: string, name: string, type: 'file' | 'folder') => void
  onCreateFile?: (folderPath: string) => void
  onCreateFolder?: (folderPath: string) => void
  nested?: boolean
  editingFilePath: string | null
  onStartEdit: (filePath: string) => void
  onCancelEdit: () => void
}

export function FolderListItem({
  folder,
  isDeletingFile = false,
  onDelete,
  onRename,
  onCreateFile,
  onCreateFolder,
  nested,
  editingFilePath,
  onStartEdit,
  onCancelEdit,
}: FolderListItemProps) {
  // All hooks must be called before any early returns
  const [collapsibleOpen, setCollapsibleOpen] = useState(false)
  const { showContextMenu } = useFolderContextMenu()
  const { toast } = useToast()
  const friendlyFolderName = folder.name
  const {
    error: renameError,
    mutateAsync: renameFile,
    reset: resetRenameState,
  } = useRenameFile()
  const { data: filesAndFolders } = useFilesAndFolders()
  const existingFiles = flattenTreeItems(filesAndFolders)
  const { removeEntriesForFolder } = useLocationHistory()
  const isEditing = editingFilePath === folder.path

  const handleSubmitNewName = useCallback(
    async (newName: string) => {
      if (newName.trim() === friendlyFolderName) {
        onCancelEdit()
        resetRenameState()
        return
      }

      try {
        const oldPath = folder.path
        await renameFile({
          oldPath: folder.path,
          newName,
          existingFiles,
        })
        onCancelEdit()
        resetRenameState()

        if (oldPath) {
          removeEntriesForFolder(oldPath)
        }
      } catch {
        // We're rendering the error on the UI
      }
    },
    [
      friendlyFolderName,
      resetRenameState,
      folder.path,
      renameFile,
      existingFiles,
      removeEntriesForFolder,
      onCancelEdit,
    ],
  )

  useEffect(() => {
    if (!isEditing) {
      resetRenameState()
    }
  }, [isEditing, resetRenameState])

  if (folder.type !== 'folder') {
    return null
  }

  const folderChildren = folder.children || []

  async function handleCopyFolderPath(folderPath: string) {
    try {
      await writeText(folderPath)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy folder path')
    }
  }

  async function handleOpenFolderInFinder(folderPath: string) {
    try {
      await revealItemInDir(folderPath)
    } catch {
      toast.error('Failed to open folder')
    }
  }

  function handleCancelNameEditing() {
    onCancelEdit()
    resetRenameState()
  }

  if (isEditing) {
    return (
      <li className="w-full">
        <ItemRenameInput
          itemName={friendlyFolderName}
          onSubmit={handleSubmitNewName}
          onCancel={handleCancelNameEditing}
          editing={isEditing}
          error={renameError}
        />
      </li>
    )
  }

  return (
    <li className="w-full">
      <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start flex items-center gap-2 !p-2 rounded-md cursor-default transition-colors hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40"
            onContextMenu={(e) =>
              showContextMenu(e, {
                folderPath: folder.path,
                folderName: folder.name,
                onCreateFile: onCreateFile && (() => onCreateFile(folder.path)),
                onCreateFolder:
                  onCreateFolder && (() => onCreateFolder(folder.path)),
                onCopyPath: () => handleCopyFolderPath(folder.path),
                onOpenInFolder: () => handleOpenFolderInFinder(folder.path),
                onRename: () => onRename(folder.path, folder.name, 'folder'),
                onDelete: () => onDelete(folder.path, folder.name, 'folder'),
                isDeletingFolder: isDeletingFile,
              })
            }
          >
            {collapsibleOpen ? <ChevronDown /> : <ChevronRight />}
            {folder.name}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent
          className={cn('pl-[17px]', folderChildren.length > 0 && 'py-px')}
        >
          {folderChildren.length > 0 && (
            <ul
              className={cn(
                'flex flex-col gap-1.5 border-l border-foreground/20 pl-1.5 truncate py-1',
                nested ? 'pr-0' : 'pr-1',
              )}
            >
              {folderChildren.map((child) => {
                if (child.type === 'file') {
                  return (
                    <FileListItem
                      key={child.path}
                      file={child}
                      isDeletingFile={isDeletingFile}
                      onDelete={onDelete}
                      editing={editingFilePath === child.path}
                      onStartEdit={onStartEdit}
                      onCancelEdit={onCancelEdit}
                    />
                  )
                }

                return (
                  <FolderListItem
                    key={child.path}
                    folder={child}
                    isDeletingFile={isDeletingFile}
                    onDelete={onDelete}
                    onRename={onRename}
                    onCreateFile={onCreateFile}
                    onCreateFolder={onCreateFolder}
                    nested
                    editingFilePath={editingFilePath}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                  />
                )
              })}
            </ul>
          )}
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

import { DraggableListItem } from '@/components/sidebar/DraggableListItem'
import { FileListItem } from '@/components/sidebar/FileListItem'
import { ItemRenameInput } from '@/components/sidebar/ItemRenameInput'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TreeItem } from '@/lib/files/types'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import {
  flattenTreeItemsWithType,
  useFilesAndFolders,
} from '@/lib/files/useFilesAndFolders'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useFolderContextMenu } from '@/lib/folders/useFolderContextMenu'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { useDroppable } from '@dnd-kit/core'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useDebounceValue } from 'usehooks-ts'

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
  const { isOver, setNodeRef } = useDroppable({
    id: encodeURIComponent(folder.path),
  })
  // All hooks must be called before any early returns
  const [collapsibleOpen, setCollapsibleOpen] = useState(false)
  const { showContextMenu } = useFolderContextMenu()
  const { toast } = useToast()
  const navigate = useNavigate()
  const friendlyFolderName = folder.name
  const {
    error: renameError,
    mutateAsync: renameFile,
    reset: resetRenameState,
  } = useRenameFile()
  const { data: filesAndFolders } = useFilesAndFolders()
  const existingFiles = flattenTreeItemsWithType(filesAndFolders)
  const { removeEntriesForFolder } = useLocationHistory()
  const isEditing = editingFilePath === folder.path
  const [currentFolderPath, updateCurrentFolderPath] = useCurrentFolderPath()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const [debouncedIsOver] = useDebounceValue(isOver, 500)

  useEffect(() => {
    if (debouncedIsOver) {
      setCollapsibleOpen(true)
    }
  }, [debouncedIsOver])

  const handleSubmitNewName = useCallback(
    async (newName: string) => {
      if (newName.trim() === friendlyFolderName) {
        onCancelEdit()
        resetRenameState()
        return
      }

      try {
        const oldPath = folder.path
        const { newPath } = await renameFile({
          oldPath: folder.path,
          newName,
          existingFiles,
          itemType: 'folder',
        })

        onCancelEdit()
        resetRenameState()
        removeEntriesForFolder(oldPath)

        if (
          currentFolderPath === oldPath ||
          currentFolderPath.startsWith(oldPath)
        ) {
          updateCurrentFolderPath(currentFolderPath.replace(oldPath, newPath))
          return
        }

        if (currentFilePath.startsWith(oldPath)) {
          updateCurrentFilePath(currentFilePath.replace(oldPath, newPath))
        }
      } catch {
        // We're rendering the error on the UI
      }
    },
    [
      friendlyFolderName,
      onCancelEdit,
      resetRenameState,
      folder.path,
      renameFile,
      existingFiles,
      removeEntriesForFolder,
      currentFolderPath,
      currentFilePath,
      updateCurrentFolderPath,
      updateCurrentFilePath,
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

  function handleOpen() {
    navigate({
      pathname: '/',
      search: `?folder=${encodeURIComponent(folder.path)}`,
    })
  }

  function handleCancelNameEditing() {
    onCancelEdit()
    resetRenameState()
  }

  return (
    <DraggableListItem id={encodeURIComponent(folder.path)}>
      <div
        ref={setNodeRef}
        className={cn(
          'w-full motion-safe:transition-all rounded-md',
          isOver && 'bg-blue-500/10',
        )}
      >
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
          <CollapsibleTrigger asChild>
            {isEditing ? (
              <div className="flex items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0 px-2">
                {collapsibleOpen ? <ChevronDown /> : <ChevronRight />}
                <ItemRenameInput
                  itemName={friendlyFolderName}
                  onSubmit={handleSubmitNewName}
                  onCancel={handleCancelNameEditing}
                  editing={isEditing}
                  error={renameError}
                  className="-translate-x-2"
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start flex items-center gap-2 !p-2 rounded-md cursor-default transition-colors',
                  'hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40',
                )}
                onContextMenu={(e) =>
                  showContextMenu(e, {
                    folderPath: folder.path,
                    folderName: folder.name,
                    onCreateFile:
                      onCreateFile && (() => onCreateFile(folder.path)),
                    onCreateFolder:
                      onCreateFolder && (() => onCreateFolder(folder.path)),
                    onOpen: handleOpen,
                    onCopyPath: () => handleCopyFolderPath(folder.path),
                    onOpenInFolder: () => handleOpenFolderInFinder(folder.path),
                    onRename: () =>
                      onRename(folder.path, folder.name, 'folder'),
                    onDelete: () =>
                      onDelete(folder.path, folder.name, 'folder'),
                    isDeletingFolder: isDeletingFile,
                  })
                }
              >
                {collapsibleOpen ? <ChevronDown /> : <ChevronRight />}
                {folder.name}
              </Button>
            )}
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
      </div>
    </DraggableListItem>
  )
}

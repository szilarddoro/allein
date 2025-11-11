import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { FileDeleteConfirmDialog } from '@/components/sidebar/FileDeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { H1, P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useCreateFolder } from '@/lib/files/useCreateFolder'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useDeleteFolder } from '@/lib/files/useDeleteFolder'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import {
  useFilesAndFolders,
  flattenTreeItemsWithType,
} from '@/lib/files/useFilesAndFolders'
import { useRenameFile } from '@/lib/files/useRenameFile'
import { useToast } from '@/lib/useToast'
import { FolderCard } from '@/pages/browser/FolderCard'
import { useSidebarContextMenu } from '@/components/sidebar/useSidebarContextMenu'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { CircleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { BrowserHeader } from './BrowserHeader'
import { FileCard } from './FileCard'
import { ItemRenameDialog } from './ItemRenameDialog'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

export function BrowserPage() {
  const { removeEntriesForFile, removeEntriesForFolder } = useLocationHistory()
  const [currentFolderPath, updateCurrentFolderPath] = useCurrentFolderPath()
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const {
    data: filesAndFolders,
    status,
    refetch: reloadFiles,
  } = useFilesAndFolders({ currentFolderPath })
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: createFolder } = useCreateFolder()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()
  const { mutateAsync: deleteFolder, isPending: isDeletingFolder } =
    useDeleteFolder()

  const { toast } = useToast()
  const navigate = useNavigate()
  const { showContextMenu } = useFileContextMenu()
  const { showContextMenu: showBackgroundContextMenu } = useSidebarContextMenu()
  const [itemToDelete, setItemToDelete] = useState<{
    path: string
    name: string
    type: 'file' | 'folder'
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState<{
    path: string
    name: string
    type: 'file' | 'folder'
  } | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const {
    error: renameError,
    mutateAsync: renameFile,
    reset: resetRenameState,
  } = useRenameFile()
  const existingFiles = flattenTreeItemsWithType(filesAndFolders)

  useEffect(() => {
    if (!isRenameDialogOpen) {
      resetRenameState()
    }
  }, [isRenameDialogOpen, resetRenameState])

  async function handleCreateFile(folderPath?: string) {
    try {
      const { path } = await createFile({
        targetFolder: folderPath || currentFolderPath || undefined,
      })
      navigate({
        pathname: '/editor',
        search: `?file=${encodeURIComponent(path)}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  async function handleCreateFolder(folderPath?: string) {
    try {
      const targetFolder = folderPath || currentFolderPath || undefined
      await createFolder({ targetFolder })

      reloadFiles()

      if (targetFolder) {
        navigate({
          pathname: '/',
          search: `?folder=${encodeURIComponent(targetFolder)}`,
        })
      }
    } catch {
      toast.error('Failed to create folder')
    }
  }

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

  function handleDeleteItem(
    itemPath: string,
    itemName: string,
    type: 'file' | 'folder',
  ) {
    setItemToDelete({ path: itemPath, name: itemName, type })
    setIsDeleteDialogOpen(true)
  }

  async function confirmDeleteItem() {
    if (!itemToDelete) return

    try {
      if (itemToDelete.type === 'folder') {
        await deleteFolder(itemToDelete.path)
        removeEntriesForFolder(itemToDelete.path)
      } else {
        await deleteFile(itemToDelete.path)
        removeEntriesForFile(itemToDelete.path)
      }
    } catch {
      toast.error(
        `Failed to delete ${itemToDelete.type === 'folder' ? 'folder' : 'file'}`,
      )
    } finally {
      setIsDeleteDialogOpen(false)

      setTimeout(() => {
        setItemToDelete(null)
      }, 150)
    }
  }

  function handleRenameItem(
    itemPath: string,
    itemName: string,
    itemType: 'file' | 'folder',
  ) {
    setItemToRename({ path: itemPath, name: itemName, type: itemType })
    setIsRenameDialogOpen(true)
  }

  const handleSubmitRename = useCallback(
    async (newName: string) => {
      if (!itemToRename) return

      const friendlyName =
        itemToRename.type === 'file'
          ? getDisplayName(itemToRename.name)
          : itemToRename.name
      if (newName.trim() === friendlyName) {
        setIsRenameDialogOpen(false)
        resetRenameState()
        setTimeout(() => setItemToRename(null), 150)
        return
      }

      try {
        const oldPath = itemToRename.path
        const { newPath } = await renameFile({
          oldPath: itemToRename.path,
          newName,
          existingFiles,
          itemType: itemToRename.type,
        })
        setIsRenameDialogOpen(false)
        resetRenameState()

        if (oldPath) {
          if (itemToRename.type === 'file') {
            removeEntriesForFile(oldPath)
          } else {
            removeEntriesForFolder(oldPath)
          }
        }

        // Handle path updates if renaming affects current location
        if (itemToRename.type === 'folder') {
          // Check if current folder is the renamed folder or a descendant
          if (
            currentFolderPath === oldPath ||
            currentFolderPath?.startsWith(oldPath)
          ) {
            updateCurrentFolderPath(
              currentFolderPath!.replace(oldPath, newPath),
            )
            reloadFiles()
            setTimeout(() => setItemToRename(null), 150)
            return
          }

          // Check if current file is in the renamed folder or its descendants
          if (currentFilePath?.startsWith(oldPath)) {
            updateCurrentFilePath(currentFilePath.replace(oldPath, newPath))
          }
        }

        reloadFiles()

        setTimeout(() => setItemToRename(null), 150)
      } catch {
        // Error is displayed in the dialog component
      }
    },
    [
      itemToRename,
      existingFiles,
      renameFile,
      resetRenameState,
      reloadFiles,
      removeEntriesForFile,
      removeEntriesForFolder,
      currentFolderPath,
      currentFilePath,
      updateCurrentFolderPath,
      updateCurrentFilePath,
    ],
  )

  function handleCancelRename() {
    setIsRenameDialogOpen(false)
    resetRenameState()
    setTimeout(() => setItemToRename(null), 150)
  }

  if (status === 'pending') {
    return (
      <div className="flex-1 overflow-hidden flex justify-center items-center">
        <DelayedActivityIndicator>
          Loading files and folders...
        </DelayedActivityIndicator>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center animate-fade-in delay-200">
        <P className="text-destructive flex flex-row gap-1 items-center text-sm">
          <CircleAlert className="size-4" />
          An error occurred while loading files and folders.
        </P>

        <Button size="sm" variant="destructive" onClick={() => reloadFiles()}>
          Reload
        </Button>
      </div>
    )
  }

  if (filesAndFolders.length === 0) {
    return (
      <>
        <BrowserHeader onCreateFile={handleCreateFile} />

        <div
          className="flex-1 overflow-hidden flex flex-col justify-center items-center"
          onContextMenu={(e) =>
            showBackgroundContextMenu(e, {
              onCreateFile: () => handleCreateFile(),
              onCreateFolder: () => handleCreateFolder(),
            })
          }
        >
          <H1 className="text-sm text-muted-foreground px-2 text-center font-normal !my-0">
            This folder is empty
          </H1>
        </div>
      </>
    )
  }

  return (
    <>
      <FileDeleteConfirmDialog
        itemToDelete={itemToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
            // Keep itemToDelete until dialog is fully closed to prevent text jump
            setTimeout(() => setItemToDelete(null), 150)
          }
        }}
        onSubmit={confirmDeleteItem}
        deletePending={isDeletingFile || isDeletingFolder}
      />

      <ItemRenameDialog
        isOpen={isRenameDialogOpen}
        itemName={itemToRename?.name ?? null}
        itemType={itemToRename?.type ?? 'file'}
        error={renameError}
        onSubmit={handleSubmitRename}
        onCancel={handleCancelRename}
      />

      <BrowserHeader onCreateFile={handleCreateFile} />

      <nav
        aria-label="File browser"
        className="scroll-mt-0 flex-1 min-h-0"
        onContextMenu={(e) =>
          showBackgroundContextMenu(e, {
            onCreateFile: () => handleCreateFile(),
            onCreateFolder: () => handleCreateFolder(),
          })
        }
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-16">
          {filesAndFolders.map((data) => {
            if (data.type === 'folder') {
              return (
                <FolderCard
                  key={data.path}
                  folder={data}
                  onCreateFile={handleCreateFile}
                  onCreateFolder={handleCreateFolder}
                  onRename={() =>
                    handleRenameItem(data.path, data.name, 'folder')
                  }
                  onDelete={(path, name) =>
                    handleDeleteItem(path, name, 'folder')
                  }
                />
              )
            }

            return (
              <FileCard
                key={data.path}
                file={data}
                isDeletingFile={isDeletingFile}
                onShowContextMenu={showContextMenu}
                onCopyFilePath={handleCopyFilePath}
                onOpenInFolder={handleOpenInFolder}
                onRename={() => handleRenameItem(data.path, data.name, 'file')}
                onDelete={(filePath, fileName) =>
                  handleDeleteItem(filePath, fileName, 'file')
                }
                navigate={navigate}
              />
            )
          })}
        </ul>
      </nav>
    </>
  )
}

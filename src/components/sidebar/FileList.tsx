import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { FileDeleteConfirmDialog } from '@/components/sidebar/FileDeleteConfirmDialog'
import { FileListItem } from '@/components/sidebar/FileListItem'
import { FolderListItem } from '@/components/sidebar/FolderListItem'
import { P } from '@/components/ui/typography'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useCreateFolder } from '@/lib/files/useCreateFolder'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useDeleteFolder } from '@/lib/files/useDeleteFolder'
import { useFilesAndFolders } from '@/lib/files/useFilesAndFolders'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { useToast } from '@/lib/useToast'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function FileList() {
  const { removeEntriesForFile, removeEntriesForFolder } = useLocationHistory()
  const { data: filesAndFolders, status, error, refetch } = useFilesAndFolders()
  const [currentFilePath] = useCurrentFilePath()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: createFolder } = useCreateFolder()
  const { mutateAsync: deleteFile, status: deleteFileStatus } = useDeleteFile()
  const { mutateAsync: deleteFolder, status: deleteFolderStatus } =
    useDeleteFolder()
  const [itemToDelete, setItemToDelete] = useState<{
    path: string
    name: string
    type: 'file' | 'folder'
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingFilePath, setEditingFilePath] = useState<string | null>(null)

  const deleteStatus =
    deleteFileStatus === 'pending' || deleteFolderStatus === 'pending'
      ? 'pending'
      : 'idle'

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

      // Navigate to home if deleting the currently edited file
      if (currentFilePath === itemToDelete.path) {
        navigate('/')
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

  if (status === 'pending') {
    return (
      <DelayedActivityIndicator className="self-center">
        Loading files...
      </DelayedActivityIndicator>
    )
  }

  if (status === 'error') {
    return (
      <P className="text-xs text-muted-foreground px-2 text-center mt-2">
        {error?.message || 'Failed to load files'}
      </P>
    )
  }

  if (filesAndFolders.length === 0) {
    return (
      <P className="text-xs text-muted-foreground px-2 text-center mt-2">
        No files were found.
      </P>
    )
  }

  function handleDeleteRequest(
    path: string,
    name: string,
    type: 'file' | 'folder',
  ) {
    setItemToDelete({ path, name, type })
    setIsDeleteDialogOpen(true)
  }

  async function handleCreateFileInFolder(folderPath: string) {
    try {
      const { path } = await createFile({
        targetFolder: folderPath,
      })
      navigate({
        pathname: '/editor',
        search: `?file=${encodeURIComponent(path)}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  async function handleCreateFolderInFolder(folderPath: string) {
    try {
      await createFolder({
        targetFolder: folderPath,
      })
      refetch()
    } catch {
      toast.error('Failed to create folder')
    }
  }

  return (
    <>
      <FileDeleteConfirmDialog
        itemToDelete={itemToDelete}
        open={isDeleteDialogOpen}
        onSubmit={confirmDeleteItem}
        deletePending={deleteStatus === 'pending'}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
            // Keep itemToDelete until dialog is fully closed to prevent text jump
            setTimeout(() => setItemToDelete(null), 150)
          }
        }}
      />

      <nav aria-label="File browser">
        <ul className="flex flex-col gap-1.5 w-full">
          {filesAndFolders.map((data) => {
            if (data.type === 'folder') {
              return (
                <FolderListItem
                  key={data.path}
                  folder={data}
                  isDeletingFile={deleteStatus === 'pending'}
                  onDelete={handleDeleteRequest}
                  onCreateFile={handleCreateFileInFolder}
                  onCreateFolder={handleCreateFolderInFolder}
                  editingFilePath={editingFilePath}
                  onStartEdit={setEditingFilePath}
                  onCancelEdit={() => setEditingFilePath(null)}
                />
              )
            }

            return (
              <FileListItem
                key={data.path}
                file={data}
                isDeletingFile={deleteStatus === 'pending'}
                onDelete={handleDeleteRequest}
                editing={editingFilePath === data.path}
                onStartEdit={() => setEditingFilePath(data.path)}
                onCancelEdit={() => setEditingFilePath(null)}
              />
            )
          })}
        </ul>
      </nav>
    </>
  )
}

import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { H1, P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useDeleteFolder } from '@/lib/files/useDeleteFolder'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import { useFilesAndFolders } from '@/lib/files/useFilesAndFolders'
import { useToast } from '@/lib/useToast'
import { FolderCard } from '@/pages/browser/FolderCard'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BrowserHeader } from './BrowserHeader'
import { FileCard } from './FileCard'

export function BrowserPage() {
  const [currentFolderPath] = useCurrentFolderPath()

  const {
    data: filesAndFolders,
    status,
    refetch: reloadFiles,
  } = useFilesAndFolders({ currentFolderPath })
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()
  const { mutateAsync: deleteFolder, isPending: isDeletingFolder } =
    useDeleteFolder()

  const { toast } = useToast()
  const navigate = useNavigate()
  const { showContextMenu } = useFileContextMenu()
  const [fileToDelete, setFileToDelete] = useState<{
    path: string
    name: string
    type: 'file' | 'folder'
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  async function handleCreateFile() {
    try {
      const { path } = await createFile({
        targetFolder: currentFolderPath || undefined,
      })
      navigate({
        pathname: '/editor',
        search: `?file=${encodeURIComponent(path)}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  async function handleCopyFilePath(filePath: string) {
    try {
      await navigator.clipboard.writeText(filePath)
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
    setFileToDelete({ path: itemPath, name: itemName, type })
    setIsDeleteDialogOpen(true)
  }

  async function confirmDeleteItem() {
    if (!fileToDelete) return

    try {
      if (fileToDelete.type === 'folder') {
        await deleteFolder(fileToDelete.path)
      } else {
        await deleteFile(fileToDelete.path)
      }
    } catch {
      toast.error(
        `Failed to delete ${fileToDelete.type === 'folder' ? 'folder' : 'file'}`,
      )
    } finally {
      setIsDeleteDialogOpen(false)

      setTimeout(() => {
        setFileToDelete(null)
      }, 150)
    }
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
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center">
        <P className="text-destructive flex flex-row gap-1 items-center text-sm">
          <CircleAlert className="size-4" />
          An error occurred while loading files and folders.
        </P>

        <Button onClick={() => reloadFiles()}>Reload</Button>
      </div>
    )
  }

  if (filesAndFolders.length === 0) {
    return (
      <>
        <BrowserHeader onCreateFile={handleCreateFile} />

        <div className="flex-1 overflow-hidden flex flex-col justify-center items-center">
          <H1 className="text-sm text-muted-foreground px-2 text-center font-normal !my-0">
            This folder is empty
          </H1>
        </div>
      </>
    )
  }

  return (
    <>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
            // Keep fileToDelete until dialog is fully closed to prevent text jump
            setTimeout(() => setFileToDelete(null), 150)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {fileToDelete?.type === 'folder' ? 'Folder' : 'File'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {fileToDelete ? getDisplayName(fileToDelete.name) : ''}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              disabled={isDeletingFile || isDeletingFolder}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BrowserHeader onCreateFile={handleCreateFile} />

      <nav aria-label="File browser" className="scroll-mt-0">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-16">
          {filesAndFolders.map((data) => {
            if (data.type === 'folder') {
              return (
                <FolderCard
                  key={data.path}
                  folder={data}
                  onCreateFile={handleCreateFile}
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

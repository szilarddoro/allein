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
import { Link } from '@/components/ui/link'
import { P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import { useFileList } from '@/lib/files/useFileList'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function FileList() {
  const { data: files, status, error } = useFileList()
  const [currentFilePath] = useCurrentFilePath()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { showContextMenu } = useFileContextMenu()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()
  const [fileToDelete, setFileToDelete] = useState<{
    path: string
    name: string
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

  function handleDeleteFile(filePath: string, fileName: string) {
    setFileToDelete({ path: filePath, name: fileName })
    setIsDeleteDialogOpen(true)
  }

  async function confirmDeleteFile() {
    if (!fileToDelete) return

    try {
      await deleteFile(fileToDelete.path)

      // Navigate to home if deleting the currently edited file
      if (currentFilePath === fileToDelete.path) {
        navigate('/')
      }

      toast.success(`Deleted ${getDisplayName(fileToDelete.name)}`)
    } catch {
      toast.error('Failed to delete file')
    } finally {
      setIsDeleteDialogOpen(false)

      setTimeout(() => {
        setFileToDelete(null)
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
        {error.message}
      </P>
    )
  }

  if (files.length === 0) {
    return (
      <P className="text-xs text-muted-foreground px-2 text-center mt-2">
        No files were found.
      </P>
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
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {fileToDelete ? getDisplayName(fileToDelete.name) : ''}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFile}
              disabled={isDeletingFile}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ul className="flex flex-col gap-2 w-full">
        {files
          .sort(
            (a, b) =>
              new Date(b.modified).getTime() - new Date(a.modified).getTime(),
          )
          .map((file) => (
            <li key={file.path} className="w-full">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link
                  to={{
                    pathname: '/editor',
                    search: `?file=${file.path}`,
                  }}
                  aria-current={currentFilePath === file.path}
                  className={cn(
                    'group flex items-center gap-2 p-2 rounded-md cursor-default transition-colors',
                    currentFilePath === file.path
                      ? 'bg-zinc-200/60 hover:bg-zinc-200/90 dark:bg-zinc-700/60 dark:hover:bg-zinc-700/90'
                      : 'hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40',
                  )}
                  onContextMenu={(e) =>
                    showContextMenu(e, {
                      filePath: file.path,
                      fileName: file.name,
                      onOpen: () =>
                        navigate({
                          pathname: '/editor',
                          search: `?file=${file.path}`,
                        }),
                      onCopyPath: () => handleCopyFilePath(file.path),
                      onOpenInFolder: () => handleOpenInFolder(file.path),
                      onDelete: () => handleDeleteFile(file.path, file.name),
                      isDeletingFile,
                    })
                  }
                >
                  <span aria-hidden="true" className="flex-1 text-sm truncate">
                    {getDisplayName(file.name)}
                  </span>

                  <span className="sr-only">
                    Open file {getDisplayName(file.name)}
                  </span>
                </Link>
              </Button>
            </li>
          ))}
      </ul>
    </>
  )
}

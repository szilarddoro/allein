import { ActivityIndicator } from '@/components/ActivityIndicator'
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Link } from '@/components/ui/link'
import { P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useFileList } from '@/lib/files/useFileList'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { Copy, Edit3, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function FileList() {
  const { data: files, status, error } = useFileList()
  const [currentFilePath] = useCurrentFilePath()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()
  const [fileToDelete, setFileToDelete] = useState<{
    path: string
    name: string
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  async function handleCopyFilePath(filePath: string) {
    try {
      await navigator.clipboard.writeText(filePath)
      toast.success('File path copied to clipboard')
    } catch {
      toast.error('Failed to copy file path')
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
      <ActivityIndicator className="self-center">
        Loading files...
      </ActivityIndicator>
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
              <ContextMenu>
                <ContextMenuTrigger asChild>
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
                    >
                      <span
                        aria-hidden="true"
                        className="flex-1 text-sm truncate"
                      >
                        {getDisplayName(file.name)}
                      </span>

                      <span className="sr-only">
                        Open file {getDisplayName(file.name)}
                      </span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48" loop>
                  <ContextMenuItem
                    onClick={() =>
                      navigate({
                        pathname: '/editor',
                        search: `?file=${file.path}`,
                      })
                    }
                  >
                    <Edit3 className="w-4 h-4 mr-2 text-current" />
                    Open
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleCopyFilePath(file.path)}
                  >
                    <Copy className="w-4 h-4 mr-2 text-current" />
                    Copy path
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handleDeleteFile(file.path, file.name)}
                    disabled={isDeletingFile}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2 text-current" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          ))}
      </ul>
    </>
  )
}

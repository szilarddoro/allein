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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { H1, H3, P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import { useFileListWithPreview } from '@/lib/files/useFileListWithPreview'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import MarkdownPreview from '@/pages/editor/MarkdownPreview'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { CircleAlert, File, NotebookPen } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'

export function BrowserPage() {
  const { data: files, status, refetch: reloadFiles } = useFileListWithPreview()
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()
  const sortedFiles = (files || []).sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
  )
  const { sidebarOpen } = useOutletContext<AppLayoutContextProps>()

  const { toast } = useToast()
  const navigate = useNavigate()
  const { showContextMenu } = useFileContextMenu()
  const [fileToDelete, setFileToDelete] = useState<{
    path: string
    name: string
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  async function handleCreateFile() {
    try {
      const { path } = await createFile()
      navigate({
        pathname: '/editor',
        search: `?file=${path}&focus=true`,
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

  function handleDeleteFile(filePath: string, fileName: string) {
    setFileToDelete({ path: filePath, name: fileName })
    setIsDeleteDialogOpen(true)
  }

  async function confirmDeleteFile() {
    if (!fileToDelete) return

    try {
      await deleteFile(fileToDelete.path)
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
      <div className="flex-1 overflow-hidden flex justify-center items-center">
        <DelayedActivityIndicator>Loading files...</DelayedActivityIndicator>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center">
        <P className="text-destructive flex flex-row gap-1 items-center text-sm">
          <CircleAlert className="size-4" />
          An error occurred while loading files.
        </P>

        <Button onClick={() => reloadFiles()}>Reload files</Button>
      </div>
    )
  }

  if (sortedFiles.length === 0) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center">
        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
          <File className="size-5" />
        </div>

        <div className="flex flex-col gap-1 mt-3 mb-4">
          <H1 className="text-base text-muted-foreground px-2 text-center font-medium !my-0">
            No files are available
          </H1>

          <P className="!my-0 text-muted-foreground text-sm">
            Click the button below to take your first note.
          </P>
        </div>

        <Button size="sm" onClick={handleCreateFile}>
          <NotebookPen className="size-4" /> New file
        </Button>
      </div>
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

      <div
        className={cn(
          'relative flex flex-col gap-6 pr-4 pt-4 pb-16 max-w-7xl 3xl:max-w-4/5 4xl:max-w-3/5 w-full mx-auto',
          !sidebarOpen && 'pl-4',
        )}
      >
        <div className="flex flex-row gap-1.5 items-center justify-between">
          <H1 className="my-0 text-3xl">Browser</H1>
          <Button size="sm" variant="ghost" onClick={handleCreateFile}>
            <NotebookPen className="size-4" />
            <span aria-hidden="true">New File</span>
            <span className="sr-only">Create a new file</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedFiles.map((file) => (
            <Link
              key={file.name}
              to={{ pathname: '/editor', search: `?file=${file.path}` }}
              className="group scroll-mt-4 motion-safe:transition-transform cursor-default"
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
              <Card
                className={cn(
                  'rounded-md aspect-[3/4] px-3 py-2 pb-0 overflow-hidden gap-0 relative',
                  'before:absolute before:top-0 before:left-0 before:size-full before:z-20 before:bg-transparent before:transition-colors group-hover:before:bg-blue-500/5 group-focus:before:bg-blue-500/5',
                  'after:absolute after:bottom-0 after:left-0 after:w-full after:h-22 after:z-10 after:bg-gradient-to-t after:from-card after:to-transparent',
                )}
              >
                <CardHeader
                  className={cn('px-0', file.preview.length > 0 && 'sr-only')}
                >
                  <H3 className="text-xs text-muted-foreground font-normal mb-0 truncate">
                    <span aria-hidden="true">{getDisplayName(file.name)}</span>

                    <span className="sr-only">
                      Open file: &quot;{getDisplayName(file.name)}&quot;
                    </span>
                  </H3>
                </CardHeader>

                <CardContent className="px-0 pt-0.5 pb-0 overflow-hidden">
                  {file.preview ? (
                    <>
                      <MarkdownPreview
                        renderType="embedded"
                        content={file.preview}
                        aria-hidden="true"
                      />

                      <span className="sr-only">
                        File content: {file.preview.substring(0, 255)}
                      </span>
                    </>
                  ) : (
                    <P className="my-0 text-xs text-muted-foreground sr-only">
                      File is empty
                    </P>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

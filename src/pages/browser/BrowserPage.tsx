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
import { useFilesAndFolders } from '@/lib/files/useFilesAndFolders'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { MarkdownPreview } from '@/pages/editor/MarkdownPreview'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { CircleAlert, File, NotebookPen, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function BrowserPage() {
  const {
    data: filesAndFolders,
    status,
    refetch: reloadFiles,
  } = useFilesAndFolders()
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()

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

  if (filesAndFolders.length === 0) {
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

      <div className="flex flex-row gap-3 items-center justify-start mt-4 z-10">
        <Button
          size="icon"
          variant="default"
          onClick={handleCreateFile}
          className={cn(
            'rounded-full text-foreground cursor-pointer',
            'bg-neutral-200 border-neutral-300/80 hover:bg-neutral-300/80',
            'dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700/70',
          )}
        >
          <Plus className="size-5" />
          <span className="sr-only">Create a new file</span>
        </Button>
        <span className="inline-block h-full bg-border w-px" />
        <H1 className="my-0 text-2xl">All Files</H1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-16">
        {filesAndFolders.map((data) => {
          if (data.type === 'folder') {
            return <span key={data.path}>{data.name}</span>
          }

          return (
            <Link
              viewTransition
              key={data.path}
              to={{ pathname: '/editor', search: `?file=${data.path}` }}
              className="group scroll-mt-4 motion-safe:transition-transform cursor-default"
              onContextMenu={(e) =>
                showContextMenu(e, {
                  filePath: data.path,
                  fileName: data.name,
                  onOpen: () =>
                    navigate({
                      pathname: '/editor',
                      search: `?file=${data.path}`,
                    }),
                  onCopyPath: () => handleCopyFilePath(data.path),
                  onOpenInFolder: () => handleOpenInFolder(data.path),
                  onDelete: () => handleDeleteFile(data.path, data.name),
                  isDeletingFile,
                })
              }
            >
              <Card
                className={cn(
                  'rounded-md aspect-[3/4] px-3 py-2 pb-0 overflow-hidden gap-0 relative',
                  'before:absolute before:top-0 before:left-0 before:size-full before:z-20 before:bg-transparent before:transition-colors group-hover:before:bg-blue-500/5 group-focus:before:bg-blue-500/5',
                  'after:absolute after:bottom-0 after:left-0 after:w-full after:h-16 after:z-10 after:bg-gradient-to-t after:from-card after:to-transparent motion-safe:animate-opacity-in duration-250',
                )}
              >
                <CardHeader
                  className={cn('px-0', data.preview.length > 0 && 'sr-only')}
                >
                  <H3 className="text-xs text-muted-foreground font-normal mb-0 truncate">
                    <span aria-hidden="true">{getDisplayName(data.name)}</span>

                    <span className="sr-only">
                      Open file: &quot;{getDisplayName(data.name)}&quot;
                    </span>
                  </H3>
                </CardHeader>

                <CardContent className="px-0 pt-0.5 pb-0 overflow-hidden">
                  {data.preview ? (
                    <>
                      <MarkdownPreview
                        renderType="embedded"
                        content={data.preview}
                        aria-hidden="true"
                      />

                      <span className="sr-only">
                        File content: {data.preview.substring(0, 255)}
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
          )
        })}
      </div>
    </>
  )
}

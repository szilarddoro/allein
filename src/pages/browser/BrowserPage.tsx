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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Link } from '@/components/ui/link'
import { H1, H3, P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useFileListWithPreview } from '@/lib/files/useFileListWithPreview'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import MarkdownPreview from '@/pages/editor/MarkdownPreview'
import { CircleAlert, Copy, Edit3, NotebookPen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function BrowserPage() {
  const { data: files, status, refetch: reloadFiles } = useFileListWithPreview()
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: deleteFile, isPending: isDeletingFile } = useDeleteFile()
  const sortedFiles = (files || []).sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
  )

  const { toast } = useToast()
  const navigate = useNavigate()
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
      <div className="flex-1 overflow-hidden flex justify-center items-center select-none">
        <ActivityIndicator>Loading files...</ActivityIndicator>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center select-none">
        <P className="text-destructive flex flex-row gap-1 items-center text-sm">
          <CircleAlert className="w-4 h-4" />
          An error occurred while loading files.
        </P>

        <Button onClick={() => reloadFiles()}>Reload files</Button>
      </div>
    )
  }

  if (sortedFiles.length === 0) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col justify-center items-center select-none">
        <P className="text-sm text-muted-foreground px-2 text-center mt-2">
          No files were found.
        </P>

        <Button size="sm" onClick={handleCreateFile}>
          <NotebookPen className="w-4 h-4" /> New file
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

      <div className="relative">
        <H1 className="sr-only">Browse files</H1>

        <div className="grid grid-cols-4 gap-6 px-6 pt-4 pb-16 max-w-7xl w-full mx-auto">
          {sortedFiles.map((file) => (
            <ContextMenu key={file.name}>
              <ContextMenuTrigger asChild>
                <Link
                  to={{ pathname: '/editor', search: `?file=${file.path}` }}
                  className="scroll-mt-4 focus:scale-[102%] hover:scale-[102%] motion-safe:transition-transform cursor-default"
                >
                  <Card
                    className={cn(
                      'aspect-[3/4] px-3 py-2 pb-0 select-none overflow-hidden gap-0 relative',
                      'after:absolute after:bottom-0 after:left-0 after:w-full after:h-24 after:bg-gradient-to-t after:from-card after:to-transparent',
                    )}
                  >
                    <CardHeader className="px-0">
                      <H3 className="text-sm mb-0">
                        <span aria-hidden="true">
                          {getDisplayName(file.name)}
                        </span>

                        <span className="sr-only">
                          Open file: &quot;{getDisplayName(file.name)}&quot;
                        </span>
                      </H3>
                    </CardHeader>

                    <CardContent className="px-0 pb-0 overflow-hidden">
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
                <ContextMenuItem onClick={() => handleCopyFilePath(file.path)}>
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
          ))}
        </div>
      </div>
    </>
  )
}

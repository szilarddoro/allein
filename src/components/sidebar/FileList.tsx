import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { FileDeleteConfirmDialog } from '@/components/sidebar/FileDeleteConfirmDialog'
import { FileListItem } from '@/components/sidebar/FileListItem'
import { P } from '@/components/ui/typography'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import {
  useFilesAndFolders,
  flattenTreeItems,
} from '@/lib/files/useFilesAndFolders'
import { useToast } from '@/lib/useToast'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function FileList() {
  const { data, status, error } = useFilesAndFolders()
  const files = flattenTreeItems(data)
  const [currentFilePath] = useCurrentFilePath()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { mutateAsync: deleteFile, status: deleteStatus } = useDeleteFile()
  const [fileToDelete, setFileToDelete] = useState<{
    path: string
    name: string
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  async function confirmDeleteFile() {
    if (!fileToDelete) return

    try {
      await deleteFile(fileToDelete.path)

      // Navigate to home if deleting the currently edited file
      if (currentFilePath === fileToDelete.path) {
        navigate('/')
      }
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
        {error?.message || 'Failed to load files'}
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
      <FileDeleteConfirmDialog
        fileToDelete={fileToDelete}
        open={isDeleteDialogOpen}
        onSubmit={confirmDeleteFile}
        deletePending={deleteStatus === 'pending'}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
            // Keep fileToDelete until dialog is fully closed to prevent text jump
            setTimeout(() => setFileToDelete(null), 150)
          }
        }}
      />

      <ul className="flex flex-col gap-2 w-full">
        {files
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((file) => (
            <FileListItem
              key={file.path}
              file={file}
              deletePending={deleteStatus === 'pending'}
              onDelete={() => {
                setFileToDelete({ path: file.path, name: file.name })
                setIsDeleteDialogOpen(true)
              }}
            />
          ))}
      </ul>
    </>
  )
}

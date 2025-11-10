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
import { getDisplayName } from '@/lib/files/fileUtils'

export interface FileDeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  itemToDelete: { path: string; name: string; type?: 'file' | 'folder' } | null
  deletePending?: boolean
}

export function FileDeleteConfirmDialog({
  itemToDelete,
  open,
  deletePending,
  onOpenChange,
  onSubmit,
}: FileDeleteConfirmDialogProps) {
  const itemType = itemToDelete?.type === 'folder' ? 'Folder' : 'File'
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemType}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;
            {itemToDelete ? getDisplayName(itemToDelete.name) : ''}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onSubmit}
            disabled={deletePending}
            variant="destructive"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

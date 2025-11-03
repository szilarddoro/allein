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
  fileToDelete: { path: string; name: string } | null
  deletePending?: boolean
}

export function FileDeleteConfirmDialog({
  fileToDelete,
  open,
  deletePending,
  onOpenChange,
  onSubmit,
}: FileDeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete File</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;
            {fileToDelete ? getDisplayName(fileToDelete.name) : ''}&quot;? This
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

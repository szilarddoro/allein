import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEffect } from 'react'
import { useImproveWriting } from './useImproveWriting'
import { ActivityIndicator } from '@/components/ActivityIndicator'

interface ImprovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalText: string
  onReplace: (improvedText: string) => void
  onClose?: () => void
}

export function ImprovementDialog({
  open,
  onOpenChange,
  originalText,
  onReplace,
  onClose,
}: ImprovementDialogProps) {
  const {
    mutateAsync: improveText,
    isPending,
    error,
    data: improvedText,
    reset,
  } = useImproveWriting()

  useEffect(() => {
    async function handleOpen() {
      if (open && originalText) {
        reset()
        await improveText(originalText)
      }
    }

    handleOpen()
  }, [improveText, open, originalText, reset])

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open)

    if (!open) {
      onClose?.()
    }
  }

  const handleReplace = () => {
    if (!improvedText) {
      return
    }

    onReplace(improvedText)
    handleOpenChange(false)
    onClose?.()
  }

  const handleCancel = () => {
    handleOpenChange(false)
    reset()
    onClose?.()
  }

  const handleTryAgain = () => {
    reset()
    improveText(originalText)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col select-none p-6">
        <DialogHeader>
          <DialogTitle>Improve Writing</DialogTitle>
          <DialogDescription className="sr-only">
            AI-powered text improvement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPending ? (
            <div className="h-full flex items-center justify-center py-2 bg-muted rounded-md">
              <ActivityIndicator>Improving text...</ActivityIndicator>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col gap-1.5 items-center justify-center py-2 bg-destructive/10 text-destructive text-sm/tight rounded-md">
              <span>
                {error instanceof Error
                  ? error.message
                  : 'Failed to improve text.'}
              </span>

              <button className="underline" onClick={handleTryAgain}>
                Try again
              </button>
            </div>
          ) : improvedText ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Original Text */}
              <div className="flex flex-col overflow-hidden">
                <h3 className="text-sm font-medium mb-2">Original</h3>
                <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                  {originalText}
                </div>
              </div>

              {/* Improved Text */}
              <div className="flex flex-col overflow-hidden">
                <h3 className="text-sm font-medium mb-2">Improved</h3>
                <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                  {improvedText}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleReplace}
            disabled={isPending || !improvedText || !!error}
          >
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

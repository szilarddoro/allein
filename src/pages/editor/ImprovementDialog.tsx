import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useImproveWriting } from './useImproveWriting'
import { H3 } from '@/components/ui/typography'

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
    if (improvedText) {
      onReplace(improvedText)
      handleOpenChange(false)
      onClose?.()
    }
  }

  const handleCancel = () => {
    handleOpenChange(false)
    reset()
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col select-none">
        <DialogHeader>
          <DialogTitle>Improve Writing</DialogTitle>
          <DialogDescription className="sr-only">
            AI-powered text improvement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Original Text */}
          <div>
            <H3 className="text-sm font-medium mb-2">Original</H3>
            <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
              {originalText}
            </div>
          </div>

          {/* Improved Text */}
          <div>
            <H3 className="text-sm font-medium mb-2">Improved</H3>
            {isPending ? (
              <div className="p-6 rounded-md bg-muted flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Improving text...
                </span>
              </div>
            ) : error ? (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error instanceof Error
                  ? error.message
                  : 'Failed to improve text'}
              </div>
            ) : improvedText ? (
              <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                {improvedText}
              </div>
            ) : null}
          </div>
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

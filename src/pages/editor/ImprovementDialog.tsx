import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEffect, useRef } from 'react'
import { useImproveWriting } from './useImproveWriting'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { H3 } from '@/components/ui/typography'
import { RefreshCw } from 'lucide-react'

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
  const replaceButtonRef = useRef<HTMLButtonElement>(null)
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

  // Focus the Replace button when improved text is ready
  useEffect(() => {
    if (improvedText && !isPending && !error) {
      replaceButtonRef.current?.focus()
    }
  }, [improvedText, isPending, error])

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

  const handleTryAgain = async () => {
    reset()
    await improveText(originalText)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col select-none p-6">
        <DialogHeader>
          <DialogTitle>Improve Writing</DialogTitle>
          <DialogDescription className="sr-only">
            AI-powered text improvement
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <H3 className="text-sm font-medium mb-2">Original Text</H3>
            </div>
            <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
              {originalText}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <H3 className="text-sm font-medium mb-2">Improved Text</H3>
            </div>

            {isPending ? (
              <div className="h-full flex items-center justify-center py-2 bg-muted rounded-md">
                <ActivityIndicator>Generating text...</ActivityIndicator>
              </div>
            ) : improvedText ? (
              <div className="group relative flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTryAgain}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="sr-only">Generate new improved text</span>
                </Button>

                {improvedText}
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            ref={replaceButtonRef}
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

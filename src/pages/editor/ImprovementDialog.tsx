import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCallback, useEffect, useRef } from 'react'
import { useImproveWriting } from './useImproveWriting'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { H3 } from '@/components/ui/typography'
import { RefreshCw } from 'lucide-react'
import { useToast } from '@/lib/useToast'

interface ImprovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalText: string
  onReplace: (improvedText: string) => void
  onClose?: () => void
}

const IDEAL_TEXT_LENGTH = 255

export function ImprovementDialog({
  open,
  onOpenChange,
  originalText,
  onReplace,
  onClose,
}: ImprovementDialogProps) {
  const { toast } = useToast()
  const replaceButtonRef = useRef<HTMLButtonElement>(null)
  const { improveText, isPending, error, improvedText, reset } =
    useImproveWriting()

  const improveTextWithInfoToast = useCallback(
    async (text: string) => {
      if (text.trim().length > IDEAL_TEXT_LENGTH) {
        toast.info(
          'Text improvements work best with short texts. It may take some time to improve them.',
        )
      }

      await improveText(text)
    },
    [improveText, toast],
  )

  useEffect(() => {
    async function handleOpen() {
      if (open && originalText) {
        reset()
        await improveTextWithInfoToast(originalText)
      }
    }

    handleOpen()
  }, [improveTextWithInfoToast, open, originalText, reset])

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
    await improveTextWithInfoToast(originalText)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col select-none p-6">
        <DialogHeader>
          <DialogTitle>Improve Writing</DialogTitle>
          <DialogDescription className="sr-only">
            AI-powered text improvement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex flex-row gap-4 flex-1">
            <div className="flex flex-col gap-2 overflow-hidden flex-1/2">
              <H3 className="text-sm font-medium m-0">Original Text</H3>

              <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                <div className="overflow-hidden">{originalText}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1/2">
              <H3 className="text-sm font-medium m-0">Improved Text</H3>

              {isPending && improvedText.length === 0 ? (
                <div className="h-full flex items-center justify-center py-2 border bg-muted rounded-md">
                  <ActivityIndicator>Generating text...</ActivityIndicator>
                </div>
              ) : improvedText ? (
                <div className="group relative flex flex-auto overflow-hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleTryAgain}
                    className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="sr-only">Generate new improved text</span>
                  </Button>

                  <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                    <div className="overflow-hidden">{improvedText}</div>
                  </div>
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

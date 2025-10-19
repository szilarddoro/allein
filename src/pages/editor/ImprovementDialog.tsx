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
import { RefreshCw, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { Link } from '@/components/ui/link'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'

interface ImprovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalText: string
  onReplace: (improvedText: string) => void
  onClose?: () => void
}

const IDEAL_TEXT_LENGTH = 500

export function ImprovementDialog({
  open,
  onOpenChange,
  originalText,
  onReplace,
  onClose,
}: ImprovementDialogProps) {
  const replaceButtonRef = useRef<HTMLButtonElement>(null)
  const { improveText, isPending, error, improvedText, reset, cancel } =
    useImproveWriting()
  const { aiAssistanceEnabled } = useAIConfig()
  const { ollamaUrl } = useOllamaConfig()
  const { data: isConnected, status: connectionStatus } =
    useOllamaConnection(ollamaUrl)

  const isAiAssistanceAvailable =
    aiAssistanceEnabled && isConnected && connectionStatus === 'success'
  const showLongTextInfo = originalText.trim().length > IDEAL_TEXT_LENGTH

  useEffect(() => {
    if (!isAiAssistanceAvailable) {
      return
    }

    async function handleOpen() {
      if (open && originalText) {
        reset()
        await improveText(originalText)
      }
    }

    handleOpen()
  }, [improveText, open, originalText, reset, isAiAssistanceAvailable])

  // Focus the Replace button when improved text is ready
  useEffect(() => {
    if (improvedText && !isPending && !error) {
      replaceButtonRef.current?.focus()
    }
  }, [improvedText, isPending, error])

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open)

    if (!open) {
      cancel()
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
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col select-none p-6">
        <DialogHeader>
          <DialogTitle>Improve Writing</DialogTitle>
          <DialogDescription className="sr-only">
            AI-powered text improvement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex flex-row gap-4 flex-1 overflow-hidden">
            <div className="flex flex-col gap-2 overflow-hidden flex-1/2">
              <H3 className="text-sm font-medium m-0">Original Text</H3>

              <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                <div className="overflow-hidden">{originalText}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1/2">
              <H3 className="text-sm font-medium m-0">Improved Text</H3>

              {!isAiAssistanceAvailable ? (
                <div className="h-full bg-muted flex items-center justify-center rounded-md border text-sm text-muted-foreground">
                  <span>
                    AI assistance is not available. Go to the{' '}
                    <Link
                      to="/settings"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Settings page
                    </Link>{' '}
                    to enable it.
                  </span>
                </div>
              ) : isPending && improvedText.length === 0 ? (
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
                    <RefreshCw className="size-4" />
                    <span className="sr-only">Generate new improved text</span>
                  </Button>

                  <div className="flex-1 overflow-auto p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                    <div className="overflow-hidden">{improvedText}</div>
                  </div>
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
              ) : null}
            </div>
          </div>

          {showLongTextInfo && isAiAssistanceAvailable && (
            <Alert variant="info">
              <Info className="size-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription>
                Text improvements work best with short texts (under{' '}
                {IDEAL_TEXT_LENGTH} characters). Your selection exceeds this
                limit and may take a while to improve.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
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

import { ActivityIndicator } from '@/components/ActivityIndicator'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { InlineCode } from '@/components/ui/typography'
import {
  RECOMMENDED_AUTOCOMPLETION_MODEL,
  RECOMMENDED_WRITING_IMPROVEMENTS_MODEL,
} from '@/lib/constants'
import { useModelDownloadContext } from '@/lib/modelDownload/useModelDownloadContext'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { PropsWithChildren } from 'react'

interface ModelDownloadPanelProps {
  ollamaUrl?: string
}

function Wrapper({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        '-mt-3 p-4 border border-border dark:border-input/50 rounded-md flex flex-col justify-center items-start gap-3 text-sm bg-secondary/40 dark:bg-secondary/40 text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ModelDownloadPanel({ ollamaUrl }: ModelDownloadPanelProps) {
  const { autocompletionModel, writingImprovementsModel, startDownload } =
    useModelDownloadContext()

  const downloading =
    autocompletionModel.modelStatus === 'pending' ||
    writingImprovementsModel.modelStatus === 'pending'

  if (downloading) {
    return (
      <Wrapper className="flex-row justify-start items-center gap-1.5">
        <ActivityIndicator className="text-xs" srOnly>
          Downloading models...
        </ActivityIndicator>
        Download progress appears in the bottom left corner. You&apos;re free to
        navigate other pages.
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <p>No AI models found. Install them using the button below.</p>

      <div className="flex items-center gap-2">
        <Button
          disabled={!ollamaUrl}
          onClick={() => startDownload(ollamaUrl!)}
          size="sm"
          type="button"
        >
          Install Models
        </Button>

        <Tooltip>
          <TooltipTrigger>
            <Info className="size-4" />
          </TooltipTrigger>

          <TooltipContent className="leading-normal">
            Pressing the button will download{' '}
            <InlineCode className="text-xs px-0 bg-transparent">
              {RECOMMENDED_AUTOCOMPLETION_MODEL.name}
            </InlineCode>{' '}
            and{' '}
            <InlineCode className="text-xs px-0 bg-transparent">
              {RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name}
            </InlineCode>
            , which require approximately a total of{' '}
            <strong className="font-medium">5.5 GB</strong> of disk space.
          </TooltipContent>
        </Tooltip>
      </div>
    </Wrapper>
  )
}

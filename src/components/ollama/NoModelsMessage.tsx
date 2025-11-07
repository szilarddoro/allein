import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export interface NoModelsMessageProps {
  onCopyCommand: () => void
  recommendedModel: string
}

export function NoModelsMessage({
  recommendedModel,
  onCopyCommand,
}: NoModelsMessageProps) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-sm text-warning">
      <AlertCircle className="size-4" />
      <span>
        No models found. Run{' '}
        <Button
          type="button"
          variant="ghost"
          onClick={onCopyCommand}
          size="sm"
          className="cursor-pointer whitespace-normal mx-0 p-0 h-auto rounded-sm text-sm text-inherit hover:bg-transparent hover:dark:bg-transparent underline underline-offset-2"
          aria-label={`Copy "ollama pull ${recommendedModel}" to clipboard`}
        >
          <span className="font-mono text-normal px-0.5">
            ollama pull {recommendedModel}
          </span>
        </Button>{' '}
        in your terminal.
      </span>
    </span>
  )
}

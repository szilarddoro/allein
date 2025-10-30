import { Button } from '@/components/ui/button'
import { RECOMMENDED_MODEL } from './handlers'

export interface NoModelsMessageProps {
  onCopyCommand: () => void
}

export function NoModelsMessage({ onCopyCommand }: NoModelsMessageProps) {
  return (
    <span className="flex flex-wrap items-center gap-1 text-sm">
      No models found. Run{' '}
      <Button
        type="button"
        variant="ghost"
        onClick={onCopyCommand}
        size="sm"
        className="whitespace-normal mx-0 p-0 h-auto rounded-sm text-sm text-foreground/80"
        aria-label={`Copy "ollama pull ${RECOMMENDED_MODEL}" to clipboard`}
      >
        <span className="font-mono cursor-default px-0.5">
          ollama pull {RECOMMENDED_MODEL}
        </span>
      </Button>{' '}
      in your terminal.
    </span>
  )
}

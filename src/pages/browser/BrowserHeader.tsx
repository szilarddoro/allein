import { Button } from '@/components/ui/button'
import { H1 } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

export interface BrowserHeaderProps {
  onCreateFile: () => void
  title?: string
}

export function BrowserHeader({
  onCreateFile,
  title = 'All Files',
}: BrowserHeaderProps) {
  return (
    <header className="flex flex-row gap-3 items-center justify-start mt-4 z-10">
      <Button
        size="icon"
        variant="default"
        onClick={onCreateFile}
        className={cn(
          'rounded-full text-foreground cursor-pointer',
          'bg-neutral-200 border-neutral-300/80 hover:bg-neutral-300/80',
          'dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700/70',
        )}
      >
        <Plus className="size-5" />
        <span className="sr-only">Create a new file</span>
      </Button>
      <span className="inline-block h-full bg-border w-px" />
      <H1 className="my-0 text-2xl">{title}</H1>
    </header>
  )
}

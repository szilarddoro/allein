import { Button } from '@/components/ui/button'
import { useCheckForUpdatesWithPrompt } from '@/lib/updater/useCheckForUpdates'
import { RefreshCcw } from 'lucide-react'

export function CheckForUpdatesButton() {
  const { mutate: checkForUpdates, isPending } = useCheckForUpdatesWithPrompt()

  function handleCheckForUpdates() {
    checkForUpdates({ onUserClick: true })
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={handleCheckForUpdates}
      className="text-xs font-normal [&:not(:disabled)]:text-muted-foreground [&:disabled]:opacity-50"
    >
      {isPending ? (
        <span className="animate-spin">
          <RefreshCcw />
        </span>
      ) : (
        <RefreshCcw />
      )}
      Check for Updates
    </Button>
  )
}

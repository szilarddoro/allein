import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { H2, P } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Loader2, Download } from 'lucide-react'
import { getAppVersion } from '@/lib/version'
import { useCheckForUpdates } from '@/lib/useCheckForUpdates'
import { useCallback, useEffect } from 'react'
import { CHECK_FOR_UPDATES_EVENT } from '@/lib/constants'

export function UpdatesCard() {
  const { mutate: checkForUpdates, isPending } = useCheckForUpdates()

  const handleCheckForUpdates = useCallback(() => {
    checkForUpdates({ onUserClick: true })
  }, [checkForUpdates])

  // Listen for menu event to trigger update check
  useEffect(() => {
    const handleCheckForUpdatesEvent = () => {
      handleCheckForUpdates()
    }

    window.addEventListener(CHECK_FOR_UPDATES_EVENT, handleCheckForUpdatesEvent)
    return () =>
      window.removeEventListener(
        CHECK_FOR_UPDATES_EVENT,
        handleCheckForUpdatesEvent,
      )
  }, [handleCheckForUpdates])

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>
          <H2 className="text-xl mb-0">Updates</H2>
        </CardTitle>
        <CardDescription>
          <P className="my-0 text-muted-foreground text-sm">
            Check for and install new versions of Allein.
          </P>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <P className="text-sm text-muted-foreground mb-3">
              Current version:{' '}
              <span className="font-mono font-semibold text-foreground">
                {getAppVersion()}
              </span>
            </P>

            <Button
              onClick={handleCheckForUpdates}
              disabled={isPending}
              className="gap-2"
              variant="default"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking for updates...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Check for Updates
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

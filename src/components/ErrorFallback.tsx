import alleinLogo from '@/assets/allein-logo.png'
import { Anchor } from '@/components/ui/anchor'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { H1, P } from '@/components/ui/typography'
import { downloadLogs } from '@/lib/logging/loggingUtils'
import { logEvent } from '@/lib/logging/useLogger'
import { ChevronDown, ChevronUp, RotateCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'

export function ErrorFallback() {
  const routeError = useRouteError()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const navigate = useNavigate()

  const error = useMemo(() => {
    if (isRouteErrorResponse(routeError)) {
      return {
        name: `${routeError.status} ${routeError.statusText}`,
        message: 'An error occurred in the router.',
        stack: routeError.data,
      }
    }

    if (routeError instanceof Error) {
      return {
        name: routeError.name,
        message: routeError.message,
        stack: routeError.stack,
      }
    }

    return {
      name: 'Unknown Error',
      message: 'Unknown Error',
      stack: null,
    }
  }, [routeError])

  useEffect(() => {
    if (error) {
      logEvent('ERROR', 'ErrorBoundary', error.message, {
        stack: error.stack || null,
      })
    }
  }, [error])

  return (
    <div className="w-full h-screen bg-neutral-50 dark:bg-background flex items-center justify-center">
      <Card className="shadow-sm dark:shadow-none gap-0 text-center max-w-xl w-full">
        <CardHeader className="flex flex-col items-center justify-center gap-1 mb-1">
          <img
            draggable={false}
            src={alleinLogo}
            width={1024}
            height={1024}
            alt="Letter A in a rounded rectangle"
            className="size-16"
          />

          <CardTitle>
            <H1 className="my-0 text-2xl">Something went wrong</H1>
          </CardTitle>
        </CardHeader>

        <CardContent className="my-0 text-center">
          <P className="my-1 mx-auto">
            Please{' '}
            <Anchor
              href="https://github.com/szilarddoro/allein/issues/new"
              className="underline text-blue-500 dark:text-blue-400 hover:text-foreground hover:dark:text-foreground motion-safe:transition-colors"
            >
              submit a GitHub issue
            </Anchor>{' '}
            outlining the steps to reproduce the problem. You can{' '}
            <Button
              onClick={downloadLogs}
              variant="ghost"
              size="sm"
              className="!p-0 hover:!bg-transparent underline text-blue-500 dark:text-blue-400 hover:!text-foreground cursor-pointer text-base font-normal h-auto"
            >
              download the logs
            </Button>{' '}
            and attach them to the issue.
          </P>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 justify-center items-center mt-4 w-full">
          <Button size="sm" onClick={() => navigate('/')}>
            <RotateCw /> Retry
          </Button>

          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            className="shrink grow-0 w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {detailsOpen ? <ChevronUp /> : <ChevronDown />}
                Show Details
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="border border-border text-destructive bg-neutral-50 dark:bg-background rounded-md whitespace-pre-wrap font-mono text-sm select-auto cursor-text py-2 px-4 mt-2 max-h-56 overflow-y-auto w-full text-left">
              <P>
                {error.name}: {error.message}
              </P>
              <P>{error.stack}</P>
            </CollapsibleContent>
          </Collapsible>
        </CardFooter>
      </Card>
    </div>
  )
}

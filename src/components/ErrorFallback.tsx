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
import { ChevronDown, ChevronUp, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'

export function ErrorFallback() {
  const routeError = useRouteError()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const navigate = useNavigate()

  const error = (() => {
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
  })()

  return (
    <div className="w-full h-screen bg-neutral-50 dark:bg-background flex items-center justify-center">
      <Card className="shadow-sm dark:shadow-none gap-0 text-center max-w-xl w-full">
        <CardHeader>
          <CardTitle>
            <H1 className="my-0 text-2xl">Something went wrong</H1>
          </CardTitle>
        </CardHeader>

        <CardContent className="my-0 text-center flex flex-col text-base">
          <span>
            Please{' '}
            <Anchor
              href="https://github.com/szilarddoro/allein/issues/new"
              className="underline text-blue-500 dark:text-blue-400 hover:text-foreground hover:dark:text-foreground motion-safe:transition-colors"
            >
              submit a GitHub issue
            </Anchor>{' '}
            detailing the reproduction steps.
          </span>
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

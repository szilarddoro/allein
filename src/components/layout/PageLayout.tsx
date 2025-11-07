import { Hotkey } from '@/components/Hotkey'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLocationHistory } from '@/lib/useLocationHistory'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Cog, PanelLeftOpenIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'

export interface PageLayoutProps extends PropsWithChildren {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  fullWidth: boolean
}

export function PageLayout({
  children,
  sidebarOpen,
  setSidebarOpen,
  fullWidth,
}: PageLayoutProps) {
  const { goBack, goForward, canGoBack, canGoForward } = useLocationHistory()

  return (
    <div className="relative flex flex-1 overflow-hidden h-full">
      <div className="flex-1 flex flex-col overflow-auto h-full">
        <header className="sticky top-0 z-50 py-2 w-full shrink-0 grow-0">
          <TauriDragRegion />

          <div
            className={cn(
              'flex items-center justify-between gap-2 relative z-20 pr-3',
              !sidebarOpen && 'pl-20',
            )}
          >
            <div className="flex flex-row gap-1.5">
              {!sidebarOpen && (
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <PanelLeftOpenIcon aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent align="center" side="bottom">
                    Open Sidebar
                  </TooltipContent>
                </Tooltip>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                disabled={!canGoBack}
                aria-label="Go Back"
              >
                <ChevronLeft className="size-4.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={goForward}
                disabled={!canGoForward}
                aria-label="Go Forward"
              >
                <ChevronRight className="size-4.5" />
              </Button>
            </div>

            <div className="z-20">
              <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      to="/settings"
                      className="cursor-default"
                      viewTransition
                    >
                      <Cog className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>

                <TooltipContent align="end" side="bottom">
                  Open Preferences <Hotkey modifiers={['meta']} keyCode="," />
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <div
          className={cn(
            'flex flex-col flex-1 grow shrink-0 relative gap-6 pr-4 w-full min-h-0',
            !fullWidth && 'max-w-7xl 3xl:max-w-4/5 4xl:max-w-3/5 mx-auto',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

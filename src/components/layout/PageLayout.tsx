import { Hotkey } from '@/components/Hotkey'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CURRENT_PLATFORM } from '@/lib/constants'
import { useLocationHistory } from '@/lib/useLocationHistory'
import { useWindowState } from '@/lib/useWindowState'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Cog,
  PanelLeftOpenIcon,
  Search,
} from 'lucide-react'
import { PropsWithChildren } from 'react'

export interface PageLayoutProps extends PropsWithChildren {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  fullWidth: boolean
}

export function PageLayout({
  children,
  sidebarOpen,
  setSidebarOpen,
  setSearchOpen,
  fullWidth,
}: PageLayoutProps) {
  const { isFullscreen } = useWindowState()
  const { goBack, goForward, canGoBack, canGoForward } = useLocationHistory()

  const isFullScreenOnMac = CURRENT_PLATFORM === 'macos' && isFullscreen

  return (
    <div className="relative flex flex-1 overflow-hidden h-full z-50">
      <div className="flex-1 flex flex-col overflow-auto h-full">
        <header className="sticky top-0 z-50 py-2 w-full shrink-0 grow-0 bg-zinc-100 dark:bg-zinc-900">
          <TauriDragRegion />

          <div
            className={cn(
              'flex items-center justify-between gap-2 relative z-20 pr-3 pointer-events-none',
              !sidebarOpen && 'pl-20',
              isFullScreenOnMac && 'pl-0',
            )}
          >
            <div className="flex flex-row gap-1.5 rounded-md [&_button]:pointer-events-auto">
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

                  <TooltipContent
                    align={isFullScreenOnMac ? 'start' : 'center'}
                    side="bottom"
                  >
                    Open Sidebar
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="size-4" />
                  </Button>
                </TooltipTrigger>

                <TooltipContent align="center" side="bottom">
                  Search Files <Hotkey modifiers={['meta']} keyCode="k" />
                </TooltipContent>
              </Tooltip>

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
                      className="cursor-default pointer-events-auto"
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

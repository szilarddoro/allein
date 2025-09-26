import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { Cog, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { CURRENT_PLATFORM, IS_TAURI } from '@/lib/constants'
import { Sidebar } from '@/components/Sidebar'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWindowState } from '@/hooks/useWindowState'

export function AppLayout() {
  const [showSidebar, setShowSidebar] = useState(true)
  const { mutateAsync: createFile } = useCreateFile()
  const { isFullscreen } = useWindowState()

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-50 overflow-hidden">
      <header
        className={cn(
          'relative pl-4 pr-2 py-2 flex justify-start items-center gap-0.5',
          CURRENT_PLATFORM === 'macos' ? (isFullscreen ? 'pl-2' : 'pl-22') : '',
        )}
      >
        {IS_TAURI() && (
          <div
            className="absolute left-0 top-0 size-full z-10"
            data-tauri-drag-region
            onClick={() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
              }
            }}
          />
        )}

        <div className="flex items-center gap-2 relative z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? (
                  <PanelLeftCloseIcon aria-hidden="true" />
                ) : (
                  <PanelLeftOpenIcon aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent align="center" side="bottom">
              {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 relative z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link
                  draggable={false}
                  to="/settings"
                  className="cursor-default"
                >
                  <Cog className="w-4 h-4" />
                </Link>
              </Button>
            </TooltipTrigger>

            <TooltipContent align="center" side="bottom">
              Open Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <main className="flex-auto overflow-hidden flex">
        {showSidebar && <Sidebar onNewFile={createFile} />}

        <div className="flex-1 flex flex-col overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

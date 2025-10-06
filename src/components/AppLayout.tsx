import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
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
import { AppLayoutContextProps } from '@/lib/types'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { mutateAsync: createFile } = useCreateFile()
  const { isFullscreen } = useWindowState()
  const navigate = useNavigate()

  // Global keyboard shortcut: CMD+, (Mac) or CTRL+, (Windows/Linux) to open settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        navigate('/settings')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-900/70 overflow-hidden">
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
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <PanelLeftCloseIcon aria-hidden="true" />
                ) : (
                  <PanelLeftOpenIcon aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent
              align={
                CURRENT_PLATFORM === 'macos' && isFullscreen
                  ? 'start'
                  : 'center'
              }
              side="bottom"
            >
              {sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
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
        {sidebarOpen && <Sidebar onNewFile={createFile} />}

        <div className="flex-1 flex flex-col overflow-auto">
          <Outlet context={{ sidebarOpen } as AppLayoutContextProps} />
        </div>
      </main>
    </div>
  )
}

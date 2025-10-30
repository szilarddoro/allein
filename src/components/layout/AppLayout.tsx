import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  ChevronLeft,
  ChevronRight,
  Cog,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from 'lucide-react'
import { CURRENT_PLATFORM } from '@/lib/constants'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useWindowState } from '@/hooks/useWindowState'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { useOnboardingProgress } from '@/pages/onboarding/useOnboardingProgress'
import { useModelWarmup } from '@/lib/ollama/useModelWarmup'
import { Hotkey } from '@/components/Hotkey'
import { useFileList } from '@/lib/files/useFileList'
import { useLocationHistory } from '@/hooks/useLocationHistory'
import { ImperativePanelGroupHandle } from 'react-resizable-panels'
import { useMediaQuery } from 'usehooks-ts'

const SIDEBAR_DEFAULT_SIZE = 20
const CONTENT_DEFAULT_SIZE = 80

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { mutateAsync: createFile } = useCreateFile()
  const { isFullscreen } = useWindowState()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const { data: files, status: filesStatus } = useFileList()
  const { goBack, goForward, canGoBack, canGoForward } = useLocationHistory()
  const panelGroupRef = useRef<ImperativePanelGroupHandle | null>(null)
  const isLargeScreen = useMediaQuery('(min-width: 1920px)')
  const isExtraLargeScreen = useMediaQuery('(min-width: 2560px)')

  useModelWarmup()

  useEffect(() => {
    if (progress?.status !== 'skipped' && progress?.status !== 'completed') {
      navigate('/onboarding')
    }
  }, [navigate, progress])

  useEffect(() => {
    function handleContextMenu(ev: MouseEvent) {
      ev.preventDefault()
    }
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // CMD+, (Mac) or CTRL+, (Windows/Linux) to open settings
      if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        navigate('/settings')
      }

      // CMD+N (Mac) or CTRL+N (Windows/Linux) to create new file
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        try {
          const { path } = await createFile()
          navigate({
            pathname: '/editor',
            search: `?file=${path}&focus=true`,
          })
        } catch {
          toast.error('Failed to create file')
        }
      }

      // Prevent CMD+W (Mac) or CTRL+W (Windows/Linux) from closing the window
      if (e.key === 'w' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, createFile, toast])

  function handleResetResizablePanels() {
    if (panelGroupRef.current == null) {
      return
    }

    panelGroupRef.current.setLayout([
      SIDEBAR_DEFAULT_SIZE,
      CONTENT_DEFAULT_SIZE,
    ])
  }

  function getSidebarMinSize() {
    if (isExtraLargeScreen) {
      return 8
    }

    if (isLargeScreen) {
      return 10
    }

    return 15
  }

  function getSidebarMaxSize() {
    if (isExtraLargeScreen) {
      return 11
    }

    if (isLargeScreen) {
      return 13
    }

    return 20
  }

  if (progressStatus === 'pending' || filesStatus !== 'success') {
    return null
  }

  return (
    <BaseLayout>
      <header
        className={cn(
          'relative pl-4 pr-2 py-2 flex justify-start items-center gap-0.5',
          CURRENT_PLATFORM === 'macos' ? (isFullscreen ? 'pl-2' : 'pl-22') : '',
        )}
      >
        <TauriDragRegion />

        {files.length > 0 && (
          <div className="flex items-center gap-2 relative z-20">
            <Tooltip delayDuration={500}>
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
        )}

        <div className="flex items-center gap-2 relative z-20">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings" className="cursor-default">
                  <Cog className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>

            <TooltipContent align="center" side="bottom">
              Open Settings <Hotkey modifiers={['meta']} keyCode="," />
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="z-20">
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
      </header>

      <main className="flex-auto overflow-hidden flex">
        {sidebarOpen && files.length > 0 ? (
          <ResizablePanelGroup
            ref={panelGroupRef}
            direction="horizontal"
            autoSaveId="main-layout"
          >
            <ResizablePanel
              defaultSize={SIDEBAR_DEFAULT_SIZE}
              minSize={getSidebarMinSize()}
              maxSize={getSidebarMaxSize()}
            >
              <Sidebar onNewFile={createFile} />
            </ResizablePanel>

            <ResizableHandle onDoubleClick={handleResetResizablePanels} />

            <ResizablePanel defaultSize={CONTENT_DEFAULT_SIZE} minSize={50}>
              <div className="flex-1 flex flex-col overflow-auto h-full">
                <Outlet context={{ sidebarOpen } as AppLayoutContextProps} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1 flex flex-col overflow-auto">
            <Outlet context={{ sidebarOpen } as AppLayoutContextProps} />
          </div>
        )}
      </main>
    </BaseLayout>
  )
}

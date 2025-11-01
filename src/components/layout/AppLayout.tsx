import { Hotkey } from '@/components/Hotkey'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { SearchDialog } from '@/components/search/SearchDialog'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLocationHistory } from '@/hooks/useLocationHistory'
import { useWindowState } from '@/hooks/useWindowState'
import { useAIFeatures } from '@/lib/ai/useAIFeatures'
import { CURRENT_PLATFORM, NEW_FILE_MENU_EVENT } from '@/lib/constants'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useFileList } from '@/lib/files/useFileList'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { useOnboardingProgress } from '@/pages/onboarding/useOnboardingProgress'
import {
  ChevronLeft,
  ChevronRight,
  Cog,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Search,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useMediaQuery } from 'usehooks-ts'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const { mutateAsync: createFile } = useCreateFile()
  const { isFullscreen } = useWindowState()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { toast } = useToast()
  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const { data: files, status: filesStatus } = useFileList()
  const { goBack, goForward, canGoBack, canGoForward } = useLocationHistory()
  const panelGroupRef = useRef<ImperativePanelGroupHandle | null>(null)
  const sidebarPanelRef = useRef<ImperativePanelHandle | null>(null)
  const isLargeScreen = useMediaQuery('(min-width: 1920px)')
  const isExtraLargeScreen = useMediaQuery('(min-width: 2560px)')

  const fileLength = files?.length ?? 0

  useAIFeatures()

  useEffect(() => {
    if (!sidebarOpen) {
      sidebarPanelRef.current?.collapse()
    } else {
      sidebarPanelRef.current?.expand()
    }
  }, [sidebarOpen])

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
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  const createNewFile = useCallback(async () => {
    try {
      const { path } = await createFile()
      navigate(
        {
          pathname: '/editor',
          search: `?file=${path}&focus=true`,
        },
        { viewTransition: true },
      )
    } catch {
      toast.error('Failed to create file')
    }
  }, [createFile, navigate, toast])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        navigate('/settings')
      }

      if (e.key === 'w' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()

        if (pathname.startsWith('/editor')) {
          navigate('/')
        }
      }

      if (fileLength > 0 && e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(true)
      }

      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        try {
          await createNewFile()
        } catch {
          toast.error('Failed to create file.')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createNewFile, fileLength, navigate, pathname, toast])

  // Events are dispatched by the global Tauri menu item
  useEffect(() => {
    const handleCreateNewFile = async () => {
      try {
        await createNewFile()
      } catch {
        toast.error('Failed to create file.')
      }
    }

    window.addEventListener(NEW_FILE_MENU_EVENT, handleCreateNewFile)
    return () =>
      window.removeEventListener(NEW_FILE_MENU_EVENT, handleCreateNewFile)
  }, [createNewFile, toast])

  function getSidebarDefaultSize() {
    if (isExtraLargeScreen) {
      return 9
    }

    if (isLargeScreen) {
      return 11
    }

    return 17
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

  function handleResetResizablePanels() {
    if (panelGroupRef.current == null) {
      return
    }

    panelGroupRef.current.setLayout([
      getSidebarDefaultSize(),
      100 - getSidebarDefaultSize(),
    ])
  }

  if (progressStatus === 'pending' || filesStatus !== 'success') {
    return null
  }

  return (
    <BaseLayout>
      <header
        className={cn(
          'relative pl-4 pr-2 py-2 flex justify-between items-center gap-0.5',
          CURRENT_PLATFORM === 'macos' ? (isFullscreen ? 'pl-2' : 'pl-22') : '',
        )}
      >
        <TauriDragRegion />

        <div className="flex items-center gap-2 relative z-20">
          {files.length > 0 && (
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
                <Link to="/settings" className="cursor-default" viewTransition>
                  <Cog className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>

            <TooltipContent align="center" side="bottom">
              Open Settings <Hotkey modifiers={['meta']} keyCode="," />
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      <main className="flex-auto overflow-hidden flex">
        <ResizablePanelGroup
          ref={panelGroupRef}
          direction="horizontal"
          autoSaveId="main-layout"
        >
          <ResizablePanel
            defaultSize={getSidebarDefaultSize()}
            minSize={getSidebarMinSize()}
            maxSize={getSidebarMaxSize()}
            collapsedSize={0}
            collapsible
            onCollapse={() => setSidebarOpen(false)}
            onExpand={() => setSidebarOpen(true)}
            ref={sidebarPanelRef}
          >
            <Sidebar onNewFile={createFile} />
          </ResizablePanel>

          <ResizableHandle
            onDoubleClick={handleResetResizablePanels}
            className={cn('px-4 ml-1', !sidebarOpen && 'hidden')}
          />

          <ResizablePanel
            defaultSize={100 - getSidebarDefaultSize()}
            minSize={50}
          >
            <div className="flex-1 flex flex-col overflow-auto h-full">
              <Outlet
                context={
                  { sidebarOpen, setSearchOpen } satisfies AppLayoutContextProps
                }
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </BaseLayout>
  )
}

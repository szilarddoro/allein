import { Hotkey } from '@/components/Hotkey'
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
import { useLocationHistory } from '@/lib/useLocationHistory'
import { useWindowState } from '@/lib/useWindowState'
import { useAIFeatures } from '@/lib/ai/useAIFeatures'
import { CURRENT_PLATFORM, NEW_FILE_MENU_EVENT } from '@/lib/constants'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useCreateFolder } from '@/lib/files/useCreateFolder'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { useFilesAndFolders } from '@/lib/files/useFilesAndFolders'
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
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useMediaQuery } from 'usehooks-ts'
import { PageLayout } from '@/components/layout/PageLayout'
import { TauriDragRegion } from '@/components/TauriDragRegion'

export function AppLayout() {
  useAIFeatures()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: createFolder } = useCreateFolder()
  const { isFullscreen } = useWindowState()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [currentFolderPath] = useCurrentFolderPath()
  const { toast } = useToast()
  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const { data: files, status: filesStatus } = useFilesAndFolders()
  const { goBack, goForward, canGoBack, canGoForward } = useLocationHistory()
  const panelGroupRef = useRef<ImperativePanelGroupHandle | null>(null)
  const sidebarPanelRef = useRef<ImperativePanelHandle | null>(null)
  const isLargeScreen = useMediaQuery('(min-width: 1920px)')
  const isExtraLargeScreen = useMediaQuery('(min-width: 2560px)')
  const fullWidth = pathname.startsWith('/editor')

  const fileLength = files?.length ?? 0

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

  const createNewFile = useCallback(
    async (folderPath?: string) => {
      try {
        const fileContent = await createFile({
          targetFolder: folderPath || undefined,
        })
        navigate(
          {
            pathname: '/editor',
            search: `?file=${encodeURIComponent(fileContent.path)}&focus=true`,
          },
          { viewTransition: true },
        )
        return fileContent
      } catch (error) {
        toast.error('Failed to create file.')
        throw error
      }
    },
    [createFile, navigate, toast],
  )

  const createNewFolder = useCallback(async () => {
    try {
      await createFolder({})
    } catch {
      toast.error('Failed to create folder.')
    }
  }, [createFolder, toast])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createNewFile, fileLength, navigate, pathname, currentFolderPath])

  // Events are dispatched by the global Tauri menu item
  useEffect(() => {
    const handleCreateNewFile = async () => {
      await createNewFile(currentFolderPath || undefined)
    }

    window.addEventListener(NEW_FILE_MENU_EVENT, handleCreateNewFile)
    return () =>
      window.removeEventListener(NEW_FILE_MENU_EVENT, handleCreateNewFile)
  }, [createNewFile, currentFolderPath])

  function getSidebarDefaultSize() {
    if (isExtraLargeScreen) {
      return 12
    }

    if (isLargeScreen) {
      return 15
    }

    return 20
  }

  function getSidebarMinSize() {
    if (isExtraLargeScreen) {
      return 10
    }

    if (isLargeScreen) {
      return 12
    }

    return 15
  }

  function getSidebarMaxSize() {
    if (isExtraLargeScreen) {
      return 14
    }

    if (isLargeScreen) {
      return 18
    }

    return 25
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
          'hidden fixed top-0 left-0 w-full pl-4 pr-2 py-2 justify-between items-center gap-0.5 z-10',
          CURRENT_PLATFORM === 'macos' ? (isFullscreen ? 'pl-2' : 'pl-22') : '',
        )}
      >
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

            <TooltipContent align="end" side="bottom">
              Open Preferences <Hotkey modifiers={['meta']} keyCode="," />
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      <main className="relative flex-auto overflow-hidden flex z-0">
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
            className="pl-2 py-2.5 relative"
          >
            <div className="absolute top-0 left-0 right-0 h-8 z-0">
              <TauriDragRegion />
            </div>

            <Sidebar
              onNewFile={createNewFile}
              onCreateFolder={createNewFolder}
              onClose={() => setSidebarOpen(false)}
            />
          </ResizablePanel>

          <ResizableHandle
            onDoubleClick={handleResetResizablePanels}
            className={cn(
              'pr-2.5 before:left-0 before:right-[unset]',
              'data-[resize-handle-state=hover]:opacity-0 data-[resize-handle-state=drag]:opacity-0',
              !sidebarOpen && 'hidden',
            )}
          />

          <ResizablePanel
            defaultSize={100 - getSidebarDefaultSize()}
            minSize={50}
          >
            <PageLayout
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              setSearchOpen={setSearchOpen}
              fullWidth={fullWidth}
            >
              <Outlet
                context={
                  {
                    sidebarOpen,
                    setSearchOpen,
                  } satisfies AppLayoutContextProps
                }
              />
            </PageLayout>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </BaseLayout>
  )
}

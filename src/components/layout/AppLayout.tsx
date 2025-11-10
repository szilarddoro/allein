import { BaseLayout } from '@/components/layout/BaseLayout'
import { PageLayout } from '@/components/layout/PageLayout'
import { SearchDialog } from '@/components/search/SearchDialog'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useAIFeatures } from '@/lib/ai/useAIFeatures'
import { NEW_FILE_MENU_EVENT, NEW_FOLDER_MENU_EVENT } from '@/lib/constants'
import { useCreateFile } from '@/lib/files/useCreateFile'
import { useCreateFolder } from '@/lib/files/useCreateFolder'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { useFilesAndFolders } from '@/lib/files/useFilesAndFolders'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { useOnboardingProgress } from '@/pages/onboarding/useOnboardingProgress'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useMediaQuery } from 'usehooks-ts'

export function AppLayout() {
  useAIFeatures()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const { mutateAsync: createFile } = useCreateFile()
  const { mutateAsync: createFolder } = useCreateFolder()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [currentFolderPath] = useCurrentFolderPath()
  const { toast } = useToast()
  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const { data: files, status: filesStatus } = useFilesAndFolders()
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

  const createNewFolder = useCallback(
    async (folderPath?: string) => {
      try {
        const targetFolder = folderPath || currentFolderPath || undefined
        await createFolder({ targetFolder })
      } catch {
        toast.error('Failed to create folder.')
      }
    },
    [createFolder, toast, currentFolderPath],
  )

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
  }, [createFolder, currentFolderPath, fileLength, navigate, pathname])

  // Events are dispatched by the global Tauri menu item
  useEffect(() => {
    const handleCreateNewFile = async () => {
      await createNewFile(currentFolderPath || undefined)
    }

    window.addEventListener(NEW_FILE_MENU_EVENT, handleCreateNewFile)
    return () =>
      window.removeEventListener(NEW_FILE_MENU_EVENT, handleCreateNewFile)
  }, [createNewFile, currentFolderPath])

  useEffect(() => {
    const handleCreateNewFolder = async () => {
      await createNewFolder(currentFolderPath || undefined)
    }

    window.addEventListener(NEW_FOLDER_MENU_EVENT, handleCreateNewFolder)
    return () =>
      window.removeEventListener(NEW_FOLDER_MENU_EVENT, handleCreateNewFolder)
  }, [createNewFolder, currentFolderPath])

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

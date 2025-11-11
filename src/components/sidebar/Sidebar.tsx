import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { ScrollableFileList } from '@/components/sidebar/ScrollableFileList'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FileContent } from '@/lib/files/types'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'
import { useToast } from '@/lib/useToast'
import {
  DndContext,
  MouseSensor,
  pointerWithin,
  useSensor,
} from '@dnd-kit/core'
import { FilePlus, House, PanelLeftCloseIcon } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

interface SidebarProps {
  onNewFile: (folderPath?: string) => Promise<FileContent>
  onCreateFolder?: (folderPath?: string) => Promise<void>
  showIndexingProgress?: boolean
  onClose?: () => void
}

export function Sidebar({
  onNewFile,
  onCreateFolder,
  onClose,
  showIndexingProgress,
}: SidebarProps) {
  const { toast } = useToast()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [currentFolderPath] = useCurrentFolderPath()
  const [activeId, setActiveId] = useState<string | number | null>(null)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 0 },
  })

  async function handleCreateFile(folderPath?: string) {
    try {
      const { path } = await onNewFile(
        folderPath || currentFolderPath || undefined,
      )
      navigate({
        pathname: '/editor',
        search: `?file=${encodeURIComponent(path)}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  async function handleCreateFolder() {
    try {
      if (onCreateFolder) {
        await onCreateFolder()
      }
    } catch {
      toast.error('Failed to create folder')
    }
  }

  return (
    <div className="z-10 relative w-full h-full flex flex-col bg-card border border-border rounded-[12px] overflow-hidden">
      <div className="h-10 w-full sticky top-0 pt-1 pr-1">
        <TauriDragRegion />

        <div className="z-20 w-full flex flex-row justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="z-20 h-6"
              >
                <PanelLeftCloseIcon />
              </Button>
            </TooltipTrigger>

            <TooltipContent>Close Sidebar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showIndexingProgress && (
        <DelayedActivityIndicator
          delay={1500}
          className="text-xs flex justify-center items-center px-2 py-2 mx-auto left-0 right-0 w-[100px] rounded-full border border-input absolute bottom-4 bg-white/50 dark:bg-white/5 backdrop-blur-sm"
        >
          Indexing...
        </DelayedActivityIndicator>
      )}

      <div className="flex flex-col gap-2 pb-4 px-2.5">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/"
            className="flex items-center gap-2 w-full text-left justify-start cursor-default hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40"
            aria-current={pathname === '/'}
          >
            <House className="size-4" />
            <span aria-hidden="true">Home</span>
            <span className="sr-only">Go to the file list</span>
          </Link>
        </Button>

        <Button
          onClick={() => handleCreateFile()}
          className="w-full justify-start gap-2 text-left hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40"
          variant="ghost"
          size="sm"
        >
          <FilePlus className="size-4" />
          <span aria-hidden="true">New File</span>
          <span className="sr-only">Create a new file</span>
        </Button>
      </div>

      <div className="px-2.5">
        <Separator />
      </div>

      <DndContext
        onDragStart={(ev) => setActiveId(ev.active.id)}
        onDragEnd={() => setActiveId(null)}
        sensors={[mouseSensor]}
        collisionDetection={pointerWithin}
      >
        <ScrollableFileList
          activeId={activeId}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
        />
      </DndContext>
    </div>
  )
}

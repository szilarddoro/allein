import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { FileList } from '@/components/sidebar/FileList'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { H2 } from '@/components/ui/typography'
import { FileContent } from '@/lib/files/types'
import { useToast } from '@/lib/useToast'
import { FilePlus, Files, PanelLeftCloseIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

interface SidebarProps {
  onNewFile: () => Promise<FileContent>
  showIndexingProgress?: boolean
  onClose?: () => void
}

export function Sidebar({
  onNewFile,
  onClose,
  showIndexingProgress,
}: SidebarProps) {
  const { toast } = useToast()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  async function handleCreateFile() {
    try {
      const { path } = await onNewFile()
      navigate({
        pathname: '/editor',
        search: `?file=${path}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-card border border-border rounded-[12px] overflow-hidden">
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

      <div className="flex flex-col gap-2 py-4 px-3">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/"
            className="flex items-center gap-2 w-full text-left justify-start cursor-default hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40"
            aria-current={pathname === '/'}
          >
            <Files className="size-4" />
            <span aria-hidden="true">All Files</span>
            <span className="sr-only">Go to the file list</span>
          </Link>
        </Button>

        <Button
          onClick={handleCreateFile}
          className="w-full justify-start gap-2 text-left hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40"
          variant="ghost"
          size="sm"
        >
          <FilePlus className="size-4" />
          <span aria-hidden="true">New File</span>
          <span className="sr-only">Create a new file</span>
        </Button>
      </div>

      <div className="px-3">
        <Separator />
      </div>

      <div className="flex-1 overflow-y-auto pt-4 pb-20 flex flex-col gap-2 px-3">
        <H2 className="sr-only">Files</H2>

        <FileList />
      </div>
    </div>
  )
}

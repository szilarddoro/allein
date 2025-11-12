import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { H3, P } from '@/components/ui/typography'
import { TreeItem } from '@/lib/files/types'
import { useFolderContextMenu } from '@/lib/folders/useFolderContextMenu'
import { cn } from '@/lib/utils'
import { FolderClosed } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useToast } from '@/lib/useToast'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useNavigate } from 'react-router'
import { DraggableCard } from './DraggableCard'
import { useDroppable } from '@dnd-kit/core'

export interface FolderCardProps {
  folder: TreeItem & { type: 'folder' }
  onCreateFile?: (folderPath: string) => void
  onCreateFolder?: (folderPath: string) => void
  onRename?: () => void
  onDelete?: (path: string, name: string) => void
}

export function FolderCard({
  folder,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: FolderCardProps) {
  const folderChildren = folder.children || []
  const { showContextMenu } = useFolderContextMenu()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { setNodeRef, isOver } = useDroppable({
    id: `browser-${encodeURIComponent(folder.path)}`,
  })

  async function handleCopyFolderPath() {
    try {
      await writeText(folder.path)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy folder path')
    }
  }

  async function handleOpenFolderInFinder() {
    try {
      await revealItemInDir(folder.path)
    } catch {
      toast.error('Failed to open folder')
    }
  }

  function handleOpen() {
    navigate({
      pathname: '/',
      search: `?folder=${encodeURIComponent(folder.path)}`,
    })
  }

  function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
    showContextMenu(e as MouseEvent, {
      folderPath: folder.path,
      folderName: folder.name,
      onCreateFile: onCreateFile && (() => onCreateFile(folder.path)),
      onCreateFolder: onCreateFolder && (() => onCreateFolder(folder.path)),
      onOpen: handleOpen,
      onCopyPath: handleCopyFolderPath,
      onOpenInFolder: handleOpenFolderInFinder,
      onRename: onRename ? onRename : () => {},
      onDelete: onDelete ? () => onDelete(folder.path, folder.name) : () => {},
      isDeletingFolder: false,
    })
  }

  return (
    <DraggableCard
      id={encodeURIComponent(folder.path)}
      className="relative scroll-mt-20"
    >
      <Link
        viewTransition
        key={folder.path}
        to={{
          pathname: '/',
          search: `?folder=${encodeURIComponent(folder.path)}`,
        }}
        className="group cursor-default motion-safe:transition-colors outline-none"
      >
        <Card
          ref={setNodeRef}
          className={cn(
            'rounded-md aspect-[3/4] px-3 py-2 pb-0 overflow-hidden gap-0 relative bg-card dark:bg-card/60',
            'before:absolute before:top-0 before:left-0 before:size-full group-hover:before:bg-blue-500/5 group-focus:before:bg-blue-500/5 before:motion-safe:transition-colors',
            isOver && 'bg-blue-500/10 before:bg-blue-500/20',
          )}
          onContextMenu={handleContextMenu}
        >
          <CardHeader className={cn('px-0 sr-only')}></CardHeader>

          <CardContent className="p-0 flex flex-col justify-center items-center h-full">
            <FolderClosed className="size-7 text-blue-500" />
            <H3 className="text-sm font-medium mb-0 truncate">
              <span aria-hidden="true">{folder.name}</span>

              <span className="sr-only">
                Open folder: &quot;{folder.name}&quot;
              </span>
            </H3>
            <P className="text-xs text-muted-foreground my-0 mt-0.5">
              {folderChildren.length}{' '}
              {folderChildren.length === 1 ? 'item' : 'items'}
            </P>
          </CardContent>
        </Card>
      </Link>
    </DraggableCard>
  )
}

import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { getDisplayName } from '@/lib/files/fileUtils'
import { FileInfo } from '@/lib/files/types'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { useNavigate } from 'react-router'

export interface FileListItemProps {
  file: FileInfo
  deletePending?: boolean
  onDelete: () => void
}

export function FileListItem({
  file,
  deletePending = false,
  onDelete,
}: FileListItemProps) {
  const [currentFilePath] = useCurrentFilePath()
  const { showContextMenu } = useFileContextMenu()
  const { toast } = useToast()
  const navigate = useNavigate()

  async function handleCopyFilePath(filePath: string) {
    try {
      await navigator.clipboard.writeText(filePath)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy file path')
    }
  }

  async function handleOpenInFolder(filePath: string) {
    try {
      await revealItemInDir(filePath)
    } catch {
      toast.error('Failed to open in folder')
    }
  }

  return (
    <li className="w-full">
      <Button asChild variant="ghost" size="sm" className="w-full">
        <Link
          viewTransition
          to={{
            pathname: '/editor',
            search: `?file=${file.path}`,
          }}
          aria-current={currentFilePath === file.path}
          className={cn(
            'group flex items-center gap-2 p-2 rounded-md cursor-default transition-colors',
            currentFilePath === file.path
              ? 'bg-neutral-200/60 hover:bg-neutral-200/90 dark:bg-neutral-700/60 dark:hover:bg-neutral-700/90'
              : 'hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40',
          )}
          onContextMenu={(e) =>
            showContextMenu(e, {
              filePath: file.path,
              fileName: file.name,
              onOpen: () =>
                navigate({
                  pathname: '/editor',
                  search: `?file=${file.path}`,
                }),
              onCopyPath: () => handleCopyFilePath(file.path),
              onOpenInFolder: () => handleOpenInFolder(file.path),
              onDelete: () => onDelete(),
              isDeletingFile: deletePending,
            })
          }
        >
          <span aria-hidden="true" className="flex-1 text-sm truncate">
            {getDisplayName(file.name)}
          </span>

          <span className="sr-only">Open file {getDisplayName(file.name)}</span>
        </Link>
      </Button>
    </li>
  )
}

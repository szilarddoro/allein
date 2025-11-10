import { FileListItem } from '@/components/sidebar/FileListItem'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TreeItem } from '@/lib/files/types'
import { useFolderContextMenu } from '@/lib/folders/useFolderContextMenu'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

export interface FolderListItemProps {
  folder: TreeItem
  isDeletingFile?: boolean
  onDelete: (path: string, name: string, type: 'file' | 'folder') => void
  nested?: boolean
}

export function FolderListItem({
  folder,
  isDeletingFile = false,
  onDelete,
  nested,
}: FolderListItemProps) {
  const [collapsibleOpen, setCollapsibleOpen] = useState(false)
  const { showContextMenu } = useFolderContextMenu()
  const { toast } = useToast()

  if (folder.type !== 'folder') {
    return null
  }

  const folderChildren = folder.children || []

  async function handleCopyFolderPath(folderPath: string) {
    try {
      await writeText(folderPath)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy folder path')
    }
  }

  async function handleOpenFolderInFinder(folderPath: string) {
    try {
      await revealItemInDir(folderPath)
    } catch {
      toast.error('Failed to open folder')
    }
  }

  return (
    <li className="w-full">
      <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start flex items-center gap-2 !p-2 rounded-md cursor-default transition-colors hover:bg-neutral-200/40 dark:hover:bg-neutral-700/40"
            onContextMenu={(e) =>
              showContextMenu(e, {
                folderPath: folder.path,
                folderName: folder.name,
                onCopyPath: () => handleCopyFolderPath(folder.path),
                onOpenInFolder: () => handleOpenFolderInFinder(folder.path),
                onDelete: () => onDelete(folder.path, folder.name, 'folder'),
                isDeletingFolder: isDeletingFile,
              })
            }
          >
            {collapsibleOpen ? <ChevronDown /> : <ChevronRight />}
            {folder.name}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent
          className={cn('pl-[17px]', folderChildren.length > 0 && 'py-px')}
        >
          {folderChildren.length > 0 && (
            <ul
              className={cn(
                'border-l border-foreground/20 pl-1.5 truncate py-1',
                nested ? 'pr-0' : 'pr-1',
              )}
            >
              {folderChildren.map((child) => {
                if (child.type === 'file') {
                  return (
                    <FileListItem
                      key={child.path}
                      file={child}
                      isDeletingFile={isDeletingFile}
                      onDelete={onDelete}
                    />
                  )
                }

                return (
                  <FolderListItem
                    key={child.path}
                    folder={child}
                    isDeletingFile={isDeletingFile}
                    onDelete={onDelete}
                    nested
                  />
                )
              })}
            </ul>
          )}
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

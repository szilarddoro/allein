import { FileListItem } from '@/components/sidebar/FileListItem'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TreeItem } from '@/lib/files/types'
import { useFileContextMenu } from '@/lib/files/useFileContextMenu'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export interface FolderListItemProps {
  folder: TreeItem
  isDeletingFile?: boolean
  onDelete: (path: string, name: string, type: 'file' | 'folder') => void
}

export function FolderListItem({
  folder,
  isDeletingFile = false,
  onDelete,
}: FolderListItemProps) {
  const [collapsibleOpen, setCollapsibleOpen] = useState(false)
  const { showContextMenu } = useFileContextMenu()

  if (folder.type !== 'folder') {
    return null
  }

  const folderChildren = folder.children || []

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
                filePath: folder.path,
                fileName: folder.name,
                onOpen: () => {},
                onCopyPath: () => {},
                onOpenInFolder: () => {},
                onDelete: () => onDelete(folder.path, folder.name, 'folder'),
                isDeletingFile,
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
            <ul className="border-l border-foreground/20 pl-1.5 truncate py-1">
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

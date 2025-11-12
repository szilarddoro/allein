import { FileList } from '@/components/sidebar/FileList'
import { useSidebarContextMenu } from '@/components/sidebar/useSidebarContextMenu'
import { H2 } from '@/components/ui/typography'
import { useDroppable } from '@dnd-kit/core'

export interface ScrollableFileListProps {
  onCreateFile: () => void
  onCreateFolder: () => void
}

export function ScrollableFileList({
  onCreateFile,
  onCreateFolder,
}: ScrollableFileListProps) {
  const { showContextMenu } = useSidebarContextMenu()
  const { setNodeRef } = useDroppable({
    id: 'home-folder',
  })

  return (
    <div
      ref={setNodeRef}
      className="relative flex-1 overflow-y-auto pt-4 flex flex-col gap-2 px-2.5 pb-20 z-10"
      onContextMenu={(e) =>
        showContextMenu(e, {
          onCreateFile,
          onCreateFolder,
        })
      }
    >
      <H2 className="sr-only">Files</H2>
      <FileList />
    </div>
  )
}

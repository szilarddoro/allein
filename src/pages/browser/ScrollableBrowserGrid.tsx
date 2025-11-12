import { DragOverlay, useDndMonitor, useDroppable } from '@dnd-kit/core'
import { DragOverlayTooltip } from '@/components/DragOverlayTooltip'
import { useMoveFileOnDrop } from '@/lib/dnd/useMoveFileOnDrop'
import { useState } from 'react'
import React from 'react'
import { useNavigate } from 'react-router'
import { FolderCard } from './FolderCard'
import { FileCard } from './FileCard'
import { TreeItem } from '@/lib/files/types'
import { useCurrentFolderPath } from '@/lib/files/useCurrentFolderPath'

export interface ScrollableBrowserGridProps {
  filesAndFolders: (TreeItem & { type: 'file' | 'folder' })[]
  isDeletingFile: boolean
  onShowContextMenu: (
    e: React.MouseEvent,
    options: {
      filePath: string
      fileName: string
      onOpen: () => void
      onRename: () => void
      onCopyPath: () => void
      onOpenInFolder: () => void
      onDelete: () => void
      isDeletingFile: boolean
    },
  ) => void
  onCopyFilePath: (path: string) => Promise<void>
  onOpenInFolder: (path: string) => Promise<void>
  onRenameItem: (path: string, name: string, type: 'file' | 'folder') => void
  onDeleteItem: (path: string, name: string, type: 'file' | 'folder') => void
  onCreateFile: (folderPath?: string) => Promise<void>
  onCreateFolder: (folderPath?: string) => Promise<void>
  showBackgroundContextMenu: (
    e: React.MouseEvent,
    options: { onCreateFile: () => void; onCreateFolder: () => void },
  ) => void
  navigate: ReturnType<typeof useNavigate>
}

export function ScrollableBrowserGrid({
  filesAndFolders,
  isDeletingFile,
  onShowContextMenu,
  onCopyFilePath,
  onOpenInFolder,
  onRenameItem,
  onDeleteItem,
  onCreateFile,
  onCreateFolder,
  showBackgroundContextMenu,
  navigate,
}: ScrollableBrowserGridProps) {
  const [currentFolderPath] = useCurrentFolderPath()
  const [activeItem, setActiveItem] = useState<string>()
  const [overFolder, setOverFolder] = useState<string>()
  const { setNodeRef } = useDroppable({
    id: currentFolderPath || 'home-folder',
  })

  useDndMonitor({
    onDragOver: ({ active, over }) => {
      setActiveItem(active?.id?.toString() || '')
      setOverFolder(over?.id?.toString() || '')
    },
  })

  useMoveFileOnDrop()

  const decodedActiveItem = decodeURIComponent(activeItem || '')
  const isActiveFile = decodedActiveItem.endsWith('.md')
  const decodedFolder = decodeURIComponent(overFolder || '')
  const targetFolder =
    decodedFolder === 'home-folder'
      ? 'this folder'
      : decodedFolder.split('/').pop() || ''

  return (
    <>
      <nav
        ref={setNodeRef}
        aria-label="File browser"
        className="scroll-mt-0 flex-1 min-h-0"
        onContextMenu={(e) =>
          showBackgroundContextMenu(e, {
            onCreateFile: () => onCreateFile(),
            onCreateFolder: () => onCreateFolder(),
          })
        }
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pb-16">
          {filesAndFolders.map((data) => {
            if (data.type === 'folder') {
              return (
                <FolderCard
                  key={data.path}
                  folder={data}
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  onRename={() => onRenameItem(data.path, data.name, 'folder')}
                  onDelete={(path, name) => onDeleteItem(path, name, 'folder')}
                />
              )
            }

            return (
              <FileCard
                key={data.path}
                file={data}
                isDeletingFile={isDeletingFile}
                onShowContextMenu={(e) =>
                  onShowContextMenu(e, {
                    filePath: data.path,
                    fileName: data.name,
                    onOpen: () =>
                      navigate({
                        pathname: '/editor',
                        search: `?file=${encodeURIComponent(data.path)}`,
                      }),
                    onRename: () => onRenameItem(data.path, data.name, 'file'),
                    onCopyPath: () => onCopyFilePath(data.path),
                    onOpenInFolder: () => onOpenInFolder(data.path),
                    onDelete: () => onDeleteItem(data.path, data.name, 'file'),
                    isDeletingFile,
                  })
                }
                onCopyFilePath={onCopyFilePath}
                onOpenInFolder={onOpenInFolder}
                onRename={() => onRenameItem(data.path, data.name, 'file')}
                onDelete={(filePath, fileName) =>
                  onDeleteItem(filePath, fileName, 'file')
                }
                navigate={navigate}
              />
            )
          })}
        </ul>
      </nav>

      <DragOverlay
        zIndex={100000}
        dropAnimation={{ duration: 0 }}
        className="z-[10000] pointer-events-none"
      >
        <DragOverlayTooltip
          activeItem={decodedActiveItem}
          targetFolder={targetFolder}
          isActiveFile={isActiveFile}
          dragMessage="Move into"
          targetMessage="Drag over the browser"
        />
      </DragOverlay>
    </>
  )
}

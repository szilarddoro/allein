import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { H3, P } from '@/components/ui/typography'
import { getDisplayName } from '@/lib/files/fileUtils'
import { cn } from '@/lib/utils'
import { MarkdownPreview } from '@/pages/editor/MarkdownPreview'
import type React from 'react'
import type { NavigateFunction } from 'react-router'
import type { TreeItem } from '@/lib/files/types'

export interface FileCardProps {
  file: TreeItem & { type: 'file' }
  isDeletingFile: boolean
  onShowContextMenu: (
    e: React.MouseEvent,
    options: {
      filePath: string
      fileName: string
      onOpen: () => void
      onCopyPath: () => void
      onOpenInFolder: () => void
      onDelete: () => void
      isDeletingFile: boolean
    },
  ) => void
  onCopyFilePath: (filePath: string) => void
  onOpenInFolder: (filePath: string) => void
  onDelete: (filePath: string, fileName: string) => void
  navigate: NavigateFunction
}

export function FileCard({
  file,
  isDeletingFile,
  onShowContextMenu,
  onCopyFilePath,
  onOpenInFolder,
  onDelete,
  navigate,
}: FileCardProps) {
  return (
    <li>
      <Link
        viewTransition
        key={file.path}
        to={{
          pathname: '/editor',
          search: `?file=${encodeURIComponent(file.path)}`,
        }}
        className="group scroll-mt-4 motion-safe:transition-transform cursor-default"
        onContextMenu={(e) =>
          onShowContextMenu(e, {
            filePath: file.path,
            fileName: file.name,
            onOpen: () =>
              navigate({
                pathname: '/editor',
                search: `?file=${encodeURIComponent(file.path)}`,
              }),
            onCopyPath: () => onCopyFilePath(file.path),
            onOpenInFolder: () => onOpenInFolder(file.path),
            onDelete: () => onDelete(file.path, file.name),
            isDeletingFile,
          })
        }
      >
        <Card
          className={cn(
            'rounded-md aspect-[3/4] px-3 py-2 pb-0 overflow-hidden gap-0 relative',
            'before:absolute before:top-0 before:left-0 before:size-full before:z-20 before:bg-transparent before:transition-colors group-hover:before:bg-blue-500/5 group-focus:before:bg-blue-500/5',
            'after:absolute after:bottom-0 after:left-0 after:w-full after:h-16 after:z-10 after:bg-gradient-to-t after:from-card after:to-transparent motion-safe:animate-opacity-in duration-250',
          )}
        >
          <CardHeader
            className={cn('px-0', file.preview.length > 0 && 'sr-only')}
          >
            <H3 className="text-xs text-muted-foreground font-normal mb-0 truncate">
              <span aria-hidden="true">{getDisplayName(file.name)}</span>

              <span className="sr-only">
                Open file: &quot;{getDisplayName(file.name)}&quot;
              </span>
            </H3>
          </CardHeader>

          <CardContent className="px-0 pt-0.5 pb-0 overflow-hidden">
            {file.preview ? (
              <>
                <MarkdownPreview
                  renderType="embedded"
                  content={file.preview}
                  aria-hidden="true"
                />

                <span className="sr-only">
                  File content: {file.preview.substring(0, 255)}
                </span>
              </>
            ) : (
              <P className="my-0 text-xs text-muted-foreground sr-only">
                File is empty
              </P>
            )}
          </CardContent>
        </Card>
      </Link>
    </li>
  )
}

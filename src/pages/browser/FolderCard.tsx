import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { H3, P } from '@/components/ui/typography'
import { TreeItem } from '@/lib/files/types'
import { cn } from '@/lib/utils'
import { FolderClosed } from 'lucide-react'

export interface FolderCardProps {
  folder: TreeItem & { type: 'folder' }
}

export function FolderCard({ folder }: FolderCardProps) {
  const folderChildren = folder.children || []

  return (
    <li>
      <Link
        viewTransition
        key={folder.path}
        to={{
          pathname: '/',
          search: `?folder=${encodeURIComponent(folder.path)}`,
        }}
        className="group scroll-mt-4 cursor-default motion-safe:transition-colors outline-none"
      >
        <Card
          className={cn(
            'rounded-md aspect-[3/4] px-3 py-2 pb-0 overflow-hidden gap-0 relative border-border bg-secondary',
            'before:absolute before:top-0 before:left-0 before:size-full group-hover:before:bg-blue-500/5 group-focus:before:bg-blue-500/5 before:motion-safe:transition-colors',
          )}
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
    </li>
  )
}

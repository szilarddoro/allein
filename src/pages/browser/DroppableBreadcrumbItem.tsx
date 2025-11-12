import { BreadcrumbLink } from '@/components/ui/breadcrumb'
import { Link } from '@/components/ui/link'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

export interface DroppableBreadcrumbItemProps extends PropsWithChildren {
  folderPath: string
  to: string
  isCurrentPage?: boolean
}

export function DroppableBreadcrumbItem({
  folderPath,
  to,
  isCurrentPage = false,
  children,
}: DroppableBreadcrumbItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: folderPath,
  })

  return (
    <BreadcrumbLink
      asChild
      ref={setNodeRef}
      className={cn(
        'motion-safe:transition-colors rounded-md',
        isOver && 'bg-blue-500/20 dark:bg-blue-500/30',
        isCurrentPage && 'text-foreground',
      )}
    >
      <Link viewTransition to={to}>
        {children}
      </Link>
    </BreadcrumbLink>
  )
}

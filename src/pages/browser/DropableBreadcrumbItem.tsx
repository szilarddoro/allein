import { BreadcrumbLink } from '@/components/ui/breadcrumb'
import { Link } from '@/components/ui/link'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

export interface DropableBreadcrumbItemProps extends PropsWithChildren {
  folderPath: string
  to: string
  isCurrentPage?: boolean
}

export function DropableBreadcrumbItem({
  folderPath,
  to,
  isCurrentPage = false,
  children,
}: DropableBreadcrumbItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: folderPath,
  })

  return (
    <BreadcrumbLink
      asChild
      ref={setNodeRef}
      className={cn(
        'motion-safe:transition-colors rounded-md px-1.5',
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

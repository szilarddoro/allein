import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { PropsWithChildren } from 'react'

export interface DraggableListItemProps {
  id: string
  className?: string
}

export function DraggableListItem({
  children,
  id,
  className,
}: PropsWithChildren<DraggableListItemProps>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })

  return (
    <li
      id={`draggable-${id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'motion-safe:transition-all rounded-md',
        isDragging &&
          'opacity-80 bg-blue-500/20 dark:bg-blue-500/40 pointer-events-none',
        className,
      )}
    >
      {children}
    </li>
  )
}

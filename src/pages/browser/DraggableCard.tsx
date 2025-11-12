import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { PropsWithChildren } from 'react'

export interface DraggableCardProps {
  id: string
  className?: string
}

export function DraggableCard({
  children,
  id,
  className,
}: PropsWithChildren<DraggableCardProps>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      tabIndex={-1}
      className={cn(
        'outline-none relative motion-safe:transition-all before:absolute before:bg-transparent motion-safe:before:transition-colors before:rounded-md before:z-[100] before:inset-0 before:pointer-events-none',
        isDragging &&
          'opacity-80 before:bg-blue-500/20 before:dark:bg-blue-500/40  pointer-events-none [&_*]:pointer-events-none',
        className,
      )}
    >
      {children}
    </li>
  )
}

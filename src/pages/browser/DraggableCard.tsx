import { useDraggingActive } from '@/lib/dnd/useDraggingActive'
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
  const isDraggingActive = useDraggingActive()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `browser-${id}`,
  })

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      tabIndex={-1}
      className={cn(
        'rounded-md outline-none relative motion-safe:transition-all before:absolute before:bg-transparent motion-safe:before:transition-colors before:rounded-md before:z-[100] before:inset-0 before:pointer-events-none focus-within:ring-[3px] focus-within:ring-ring/50',
        isDragging &&
          'opacity-80 before:bg-blue-500/20 before:dark:bg-blue-500/40 pointer-events-none [&_*]:pointer-events-none',
        isDraggingActive && 'pointer-events-none [&_*]:pointer-events-none',
        className,
      )}
    >
      {children}
    </li>
  )
}

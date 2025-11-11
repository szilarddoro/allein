import { cn } from '@/lib/utils'
import { TriangleAlert } from 'lucide-react'
import { PropsWithChildren } from 'react'

export interface AlertTextProps {
  id?: string
  className?: string
}

export function AlertText({
  id,
  children,
  className,
}: PropsWithChildren<AlertTextProps>) {
  return (
    <div
      id={id}
      className={cn(
        'flex flex-row gap-1 items-center rounded-sm border border-yellow-300 bg-yellow-100 dark:bg-yellow-950 dark:border-yellow-700 text-xs py-1 px-2 text-yellow-700 dark:text-yellow-400 font-normal z-1000',
        className,
      )}
    >
      <TriangleAlert className="size-3" />
      {children}
    </div>
  )
}

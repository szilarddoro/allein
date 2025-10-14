import { IS_TAURI } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface TauriDragRegionProps {
  className?: string
}

export function TauriDragRegion({ className }: TauriDragRegionProps) {
  if (!IS_TAURI()) {
    return null
  }

  return (
    <div
      className={cn('absolute left-0 top-0 size-full z-10 max-h-16', className)}
      data-tauri-drag-region
      onClick={() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }}
    />
  )
}

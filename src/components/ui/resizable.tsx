import { cn } from '@/lib/utils'
import { GripVerticalIcon } from 'lucide-react'
import * as React from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        'group relative w-px motion-safe:transition-all opacity-0 focus-visible:ring-ring flex items-center justify-center focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full [&[data-panel-group-direction=vertical]>div]:rotate-90',
        'before:absolute before:bg-border before:top-0 before:left-0 before:right-0 before:bottom-0 before:w-px before:mx-auto motion-safe:before:transition-colors',
        'data-[resize-handle-active=keyboard]:opacity-100 data-[resize-handle-state=drag]:opacity-100 data-[resize-handle-state=hover]:opacity-100',
        'data-[resize-handle-active=keyboard]:before:bg-neutral-400 data-[resize-handle-active=keyboard]:dark:before:bg-neutral-600 data-[resize-handle-state=drag]:before:bg-neutral-400 data-[resize-handle-state=drag]:dark:before:bg-neutral-600',
        'after:absolute after:w-2 after:top-0 after:right-0 after:h-full',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }

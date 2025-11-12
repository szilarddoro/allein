import { useDndMonitor } from '@dnd-kit/core'
import { useState } from 'react'

export function useDraggingActive() {
  const [active, setActive] = useState(false)

  useDndMonitor({
    onDragStart: () => setActive(true),
    onDragEnd: () => setActive(false),
  })

  return active
}

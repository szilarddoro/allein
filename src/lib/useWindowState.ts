import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function useWindowState() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    let unlisten: () => void | undefined

    const setupListeners = async () => {
      const window = getCurrentWindow()

      const fullscreen = await window.isFullscreen()

      // Get initial state
      setIsFullscreen(fullscreen)

      // Listen for changes
      // TODO: Implement a pending state indicator because the transition is not nice
      unlisten = await window.onResized(async () => {
        const fullscreen = await window.isFullscreen()
        setIsFullscreen(fullscreen)
      })
    }

    setupListeners()

    return () => unlisten?.()
  }, [])

  return { isFullscreen }
}

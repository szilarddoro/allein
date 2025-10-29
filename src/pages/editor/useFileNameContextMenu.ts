import { Menu, MenuItem } from '@tauri-apps/api/menu'
import type { MouseEvent } from 'react'
import { useCallback } from 'react'

interface FileNameContextMenuOptions {
  onCopyPath: () => void
  onOpenInFolder: () => void
}

export function useFileNameContextMenu() {
  const showContextMenu = useCallback(
    async (
      event: MouseEvent,
      options: FileNameContextMenuOptions,
    ): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()

      try {
        // Create menu items
        const copyPathItem = await MenuItem.new({
          text: 'Copy Path',
          action: () => {
            options.onCopyPath()
          },
        })

        const openInFolderItem = await MenuItem.new({
          text: 'Show in Enclosing Folder',
          action: () => {
            options.onOpenInFolder()
          },
        })

        // Build the menu
        const menu = await Menu.new({
          items: [copyPathItem, openInFolderItem],
        })

        // Show the context menu at cursor position
        await menu.popup()
      } catch {
        // Silently fail - user will see no context menu appears
      }
    },
    [],
  )

  return { showContextMenu }
}

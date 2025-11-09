import { Menu, MenuItem } from '@tauri-apps/api/menu'
import type { MouseEvent } from 'react'
import { useCallback } from 'react'

interface SidebarContextMenuOptions {
  onCreateFile: () => void
  onCreateFolder: () => void
}

export function useSidebarContextMenu() {
  const showContextMenu = useCallback(
    async (
      event: MouseEvent,
      options: SidebarContextMenuOptions,
    ): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()

      try {
        // Create menu items
        const newFileItem = await MenuItem.new({
          text: 'New File',
          action: () => {
            options.onCreateFile()
          },
        })

        const newFolderItem = await MenuItem.new({
          text: 'New Folder',
          action: () => {
            options.onCreateFolder()
          },
        })

        // Build the menu
        const menu = await Menu.new({
          items: [newFileItem, newFolderItem],
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

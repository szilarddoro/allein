import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import type { MouseEvent } from 'react'
import { useCallback } from 'react'

interface FolderContextMenuOptions {
  folderPath: string
  folderName: string
  onCreateFile?: () => void
  onCopyPath: () => void
  onOpenInFolder: () => void
  onDelete: () => void
  isDeletingFolder: boolean
}

export function useFolderContextMenu() {
  const showContextMenu = useCallback(
    async (
      event: MouseEvent,
      options: FolderContextMenuOptions,
    ): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()

      try {
        // Create menu items
        const createFileItem = await MenuItem.new({
          text: 'New File',
          action: () => {
            options.onCreateFile?.()
          },
        })

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

        const separator = await PredefinedMenuItem.new({
          item: 'Separator',
        })

        const deleteItem = await MenuItem.new({
          text: 'Delete',
          enabled: !options.isDeletingFolder,
          action: () => {
            options.onDelete()
          },
        })

        // Build the menu
        const menu = await Menu.new({
          items: [
            createFileItem,
            copyPathItem,
            openInFolderItem,
            separator,
            deleteItem,
          ],
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

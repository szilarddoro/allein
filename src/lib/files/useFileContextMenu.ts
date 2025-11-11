import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import type { MouseEvent } from 'react'
import { useCallback } from 'react'

interface FileContextMenuOptions {
  filePath: string
  fileName: string
  onOpen: () => void
  onCopyPath: () => void
  onOpenInFolder: () => void
  onDelete: () => void
  onRename: () => void
  isDeletingFile: boolean
}

export function useFileContextMenu() {
  const showContextMenu = useCallback(
    async (
      event: MouseEvent,
      options: FileContextMenuOptions,
    ): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()

      try {
        // Create menu items
        const openItem = await MenuItem.new({
          text: 'Open',
          action: () => {
            options.onOpen()
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

        const renameItem = await MenuItem.new({
          text: 'Rename...',
          action: () => {
            options.onRename()
          },
        })

        const deleteItem = await MenuItem.new({
          text: 'Delete',
          enabled: !options.isDeletingFile,
          action: () => {
            options.onDelete()
          },
        })

        // Build the menu
        const menu = await Menu.new({
          items: [
            openItem,
            copyPathItem,
            openInFolderItem,
            separator,
            renameItem,
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

import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { MouseEvent } from 'react'
import { useCallback } from 'react'

export function useMarkdownPreviewContextMenu() {
  const showContextMenu = useCallback(
    async (event: MouseEvent): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()

      // Get the selected text from the window selection
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim() || ''

      // Check if the clicked element is a link or within a link
      const target = event.target as HTMLElement
      const linkElement = target.closest('a[href]') as HTMLAnchorElement | null
      const linkHref = linkElement?.href || ''

      // If there's no selected text and no link, don't show the context menu
      if (!selectedText && !linkHref) {
        return
      }

      try {
        const menuItems: (
          | Awaited<ReturnType<typeof MenuItem.new>>
          | Awaited<ReturnType<typeof PredefinedMenuItem.new>>
        )[] = []

        // Add "Open Link in Browser" if on a link
        if (linkHref) {
          const openLinkItem = await MenuItem.new({
            text: 'Open Link in Browser',
            action: async () => {
              try {
                await openUrl(linkHref)
              } catch {
                // Silently fail if link opening fails
              }
            },
          })
          menuItems.push(openLinkItem)

          const copyLinkItem = await MenuItem.new({
            text: 'Copy Link',
            action: async () => {
              try {
                await writeText(linkHref)
              } catch {
                // Silently fail if clipboard write fails
              }
            },
          })
          menuItems.push(copyLinkItem)

          // Add separator if we also have selected text
          if (selectedText) {
            const separator = await PredefinedMenuItem.new({
              item: 'Separator',
            })
            menuItems.push(separator)
          }
        }

        // Add copy and select all items if there's selected text
        if (selectedText) {
          const copyItem = await PredefinedMenuItem.new({
            item: 'Copy',
          })
          menuItems.push(copyItem)

          const separator = await PredefinedMenuItem.new({
            item: 'Separator',
          })
          menuItems.push(separator)

          const selectAllItem = await PredefinedMenuItem.new({
            item: 'SelectAll',
          })
          menuItems.push(selectAllItem)
        }

        // Build the menu
        const menu = await Menu.new({
          items: menuItems,
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

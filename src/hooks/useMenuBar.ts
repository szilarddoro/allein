import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from '@tauri-apps/api/menu'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { openUrl } from '@tauri-apps/plugin-opener'
import { toast } from 'sonner'
import {
  NEW_FILE_MENU_EVENT,
  REDO_MENU_EVENT,
  UNDO_MENU_EVENT,
} from '@/lib/constants'

const newFileEvent = new CustomEvent(NEW_FILE_MENU_EVENT)
const undoEvent = new CustomEvent(UNDO_MENU_EVENT)
const redoEvent = new CustomEvent(REDO_MENU_EVENT)

export function useMenuBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!pathname) return

    async function setupAppMenuBar() {
      try {
        const separator = await PredefinedMenuItem.new({
          item: 'Separator',
        })

        const aboutSubmenu = await Submenu.new({
          text: 'About',
          id: 'about',
          items: [
            await MenuItem.new({
              text: 'About Allein',
            }),
            separator,
            await MenuItem.new({
              text: 'Settings',
              accelerator: 'CmdOrCtrl+,',
              enabled: !pathname.startsWith('/onboarding'),
              action() {
                navigate('/settings', { viewTransition: true })
              },
            }),
            separator,
            await PredefinedMenuItem.new({
              item: 'Hide',
            }),
            await PredefinedMenuItem.new({
              item: 'HideOthers',
            }),
            await PredefinedMenuItem.new({
              item: 'ShowAll',
            }),
            separator,
            await PredefinedMenuItem.new({
              item: 'Quit',
            }),
          ],
        })

        const fileSubmenu = await Submenu.new({
          text: 'File',
          id: 'file',
          items: [
            await MenuItem.new({
              text: 'New File',
              accelerator: 'CmdOrCtrl+N',
              action() {
                window.dispatchEvent(newFileEvent)
              },
            }),
            separator,
            await MenuItem.new({
              text: 'Close Editor',
              accelerator: 'CmdOrCtrl+W',
              enabled: pathname.startsWith('/editor'),
              action() {
                navigate('/', { viewTransition: true })
              },
            }),
          ],
        })

        const editSubmenu = await Submenu.new({
          id: 'edit',
          text: 'Edit',
          enabled: pathname.startsWith('/editor'),
          items: [
            // TODO: Implement Undo/Redo via Monaco's APIs
            await MenuItem.new({
              text: 'Undo',
              accelerator: 'CmdOrCtrl+Z',
              action() {
                window.dispatchEvent(undoEvent)
              },
            }),
            await MenuItem.new({
              text: 'Redo',
              accelerator: 'CmdOrCtrl+Shift+Z',
              action() {
                window.dispatchEvent(redoEvent)
              },
            }),
            separator,
            await PredefinedMenuItem.new({
              item: 'Cut',
            }),
            await PredefinedMenuItem.new({
              item: 'Copy',
            }),
            await PredefinedMenuItem.new({
              item: 'Paste',
            }),
          ],
        })

        const windowSubmenu = await Submenu.new({
          id: 'window',
          text: 'Window',
          items: [
            await PredefinedMenuItem.new({
              item: 'Minimize',
            }),
            await PredefinedMenuItem.new({
              item: 'Maximize',
            }),
            await PredefinedMenuItem.new({
              item: 'Fullscreen',
            }),
          ],
        })

        const helpSubmenu = await Submenu.new({
          id: 'help',
          text: 'Help',
          items: [
            await MenuItem.new({
              text: 'Documentation',
              async action() {
                try {
                  await openUrl('https://allein.app/docs')
                } catch {
                  toast.error('Failed to open documentation. Please try again.')
                }
              },
            }),
          ],
        })

        const menu = await Menu.new({
          items: [
            aboutSubmenu,
            fileSubmenu,
            editSubmenu,
            windowSubmenu,
            helpSubmenu,
          ],
        })

        await menu.setAsAppMenu()
      } catch {
        // Silently fail
      }
    }

    setupAppMenuBar()
  }, [navigate, pathname])
}

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

// TODO: Use `useMenuBar` in the AppLayout. Pass file creation handlers here, or expose global event listeners for
// the key command handler.
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
          items: [
            await MenuItem.new({
              text: 'About Allein',
            }),
            separator,
            await MenuItem.new({
              text: 'Settings',
              accelerator: 'CmdOrCtrl+,',
              action() {
                navigate('/settings')
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
          items: [
            await MenuItem.new({
              text: 'New File',
              accelerator: 'CmdOrCtrl+N',
            }),
            separator,
            await MenuItem.new({
              text: 'Close Editor',
              accelerator: 'CmdOrCtrl+W',
              enabled: pathname.startsWith('/editor'),
              action() {
                navigate('/')
              },
            }),
          ],
        })

        const editSubmenu = await Submenu.new({
          text: 'Edit',
          items: [
            // TODO: Implement Undo/Redo via Monaco's APIs
            await MenuItem.new({
              text: 'Undo',
              accelerator: 'CmdOrCtrl+Z',
            }),
            await MenuItem.new({
              text: 'Redo',
              accelerator: 'CmdOrCtrl+Shift+Z',
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

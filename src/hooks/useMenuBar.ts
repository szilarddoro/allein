import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from '@tauri-apps/api/menu'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

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

        const menu = await Menu.new({
          items: [aboutSubmenu, fileSubmenu],
        })

        await menu.setAsAppMenu()
      } catch {
        // Silently fail
      }
    }

    setupAppMenuBar()
  }, [navigate, pathname])
}

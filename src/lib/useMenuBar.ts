import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from '@tauri-apps/api/menu'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { openUrl } from '@tauri-apps/plugin-opener'
import { toast } from 'sonner'
import {
  FORMAT_DOCUMENT_EVENT,
  IMPROVE_WRITING_EVENT,
  NEW_FILE_MENU_EVENT,
  NEW_FOLDER_MENU_EVENT,
  REDO_MENU_EVENT,
  TOGGLE_PREVIEW_EVENT,
  TOGGLE_SIDEBAR_EVENT,
  UNDO_MENU_EVENT,
} from '@/lib/constants'
import { openFolderPicker } from '@/lib/folders/useOpenFolderPicker'
import { useSetFolder } from '@/lib/folders/useSetFolder'
import { sendFeedback } from '@/lib/report/sendFeedback'
import { checkForUpdatesWithPrompt } from '@/lib/updater/updater'

const newFileEvent = new CustomEvent(NEW_FILE_MENU_EVENT)
const newFolderEvent = new CustomEvent(NEW_FOLDER_MENU_EVENT)
const undoEvent = new CustomEvent(UNDO_MENU_EVENT)
const redoEvent = new CustomEvent(REDO_MENU_EVENT)
const toggleSidebarEvent = new CustomEvent(TOGGLE_SIDEBAR_EVENT)
const formatDocumentEvent = new CustomEvent(FORMAT_DOCUMENT_EVENT)
const improveWritingEvent = new CustomEvent(IMPROVE_WRITING_EVENT)
const togglePreviewEvent = new CustomEvent(TOGGLE_PREVIEW_EVENT)

export interface UseMenuBarProps {
  onOpenAbout?: (open: boolean) => void
}

export function useMenuBar({ onOpenAbout }: UseMenuBarProps = {}) {
  const previousPathNameRef = useRef<string>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { mutateAsync: setFolder } = useSetFolder()

  useEffect(() => {
    if (!pathname || previousPathNameRef.current === pathname) {
      return
    }

    previousPathNameRef.current = pathname

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
              action() {
                onOpenAbout?.(true)
              },
            }),
            separator,
            await MenuItem.new({
              text: 'Check for Updates',
              async action() {
                try {
                  await checkForUpdatesWithPrompt()
                } catch {
                  toast.error('Failed to check for updates. Please try again.')
                }
              },
            }),
            separator,
            await MenuItem.new({
              text: 'Settings...',
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
          enabled: !pathname.startsWith('/onboarding'),
          items: [
            await MenuItem.new({
              text: 'New File',
              accelerator: 'CmdOrCtrl+N',
              action() {
                window.dispatchEvent(newFileEvent)
              },
            }),
            await MenuItem.new({
              text: 'New Folder',
              accelerator: 'CmdOrCtrl+Shift+N',
              action() {
                window.dispatchEvent(newFolderEvent)
              },
            }),
            separator,
            await MenuItem.new({
              text: 'Open Folder...',
              accelerator: 'CmdOrCtrl+O',
              async action() {
                const folderPath = await openFolderPicker()
                if (folderPath) {
                  try {
                    await setFolder(folderPath)
                  } catch {
                    // Error handling is done in the mutation hook
                  }
                }
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
            separator,
            await MenuItem.new({
              text: 'Format Document',
              accelerator: 'CmdOrCtrl+Shift+F',
              action() {
                window.dispatchEvent(formatDocumentEvent)
              },
            }),
            await MenuItem.new({
              text: 'Improve Writing',
              accelerator: 'CmdOrCtrl+I',
              action() {
                window.dispatchEvent(improveWritingEvent)
              },
            }),
          ],
        })

        const viewSubmenu = await Submenu.new({
          id: 'view',
          text: 'View',
          items: [
            await MenuItem.new({
              text: 'Toggle Sidebar',
              accelerator: 'CmdOrCtrl+\\',
              action() {
                window.dispatchEvent(toggleSidebarEvent)
              },
            }),
            await MenuItem.new({
              text: 'Toggle Preview',
              accelerator: 'CmdOrCtrl+P',
              enabled: pathname.startsWith('/editor'),
              action() {
                window.dispatchEvent(togglePreviewEvent)
              },
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
              text: 'Visit the Website',
              async action() {
                try {
                  await openUrl('https://allein.app')
                } catch {
                  toast.error('Failed to open the website. Please try again.')
                }
              },
            }),
            await MenuItem.new({
              text: 'Visit the GitHub Page',
              async action() {
                try {
                  await openUrl('https://github.com/szilarddoro/allein')
                } catch {
                  toast.error('Failed to open the website. Please try again.')
                }
              },
            }),
            separator,
            await MenuItem.new({
              text: 'Send Feedback',
              action: sendFeedback,
            }),
          ],
        })

        const menu = await Menu.new({
          items: [
            aboutSubmenu,
            fileSubmenu,
            editSubmenu,
            viewSubmenu,
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
  }, [navigate, pathname, onOpenAbout, setFolder])
}

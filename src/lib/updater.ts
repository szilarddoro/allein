import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'

/**
 * Check for updates and prompt user to install if available
 * @param onUserClick - If true, shows a message even if no update is available
 */
export async function checkForUpdates(
  onUserClick: boolean = false,
): Promise<boolean> {
  try {
    const update = await check()

    console.log(update)

    if (update != null) {
      const changelog = update.body || 'New version available'

      // Show dialog with update information
      const shouldInstall = await ask(
        `A new version (${update.version}) is available.\n\n${changelog}\n\nWould you like to install it now?`,
        {
          title: 'Update Available',
          kind: 'info',
          okLabel: 'Install',
          cancelLabel: 'Later',
        },
      )

      if (shouldInstall) {
        // Download and install the update
        await update.downloadAndInstall()

        // Relaunch the app
        await relaunch()
        return true
      }
    } else if (onUserClick) {
      // Only show "no update available" message if user manually clicked check
      await message("You're running the latest version!", {
        title: 'No Update Available',
        kind: 'info',
      })
    }

    return false
  } catch (error) {
    // Log error silently, only show dialog if user initiated the check
    if (onUserClick) {
      await message(`Failed to check for updates: ${error}`, {
        title: 'Update Check Error',
        kind: 'error',
      })
    }

    return false
  }
}

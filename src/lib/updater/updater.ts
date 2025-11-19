import { check, Update } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'
import { logEvent } from '@/lib/logging/useLogger'

/**
 * Silent check for updates without any user prompts
 * Used for automatic background checking on app startup
 * @returns true if an update is available, false otherwise
 */
export async function checkForUpdates(): Promise<Update | null> {
  try {
    const update = await check()
    return update
  } catch {
    // Fail silently
    return null
  }
}

/**
 * Updates and relaunches the app.
 *
 * @param update - Object containing information about the update
 */
export async function updateApp(update: Update | null) {
  if (update == null) {
    return
  }

  try {
    // Download and install the update
    await update.downloadAndInstall()

    // Relaunch the app
    await relaunch()
  } catch (error) {
    logEvent(
      'ERROR',
      'updater',
      `Failed to install the update: ${(error as Error).message}`,
      { stack: (error as Error).stack || null },
    )
  }
}

/**
 * Check for updates and prompt user to install if available
 * @param onUserClick - If true, shows a message even if no update is available
 */
export async function checkForUpdatesWithPrompt(
  onUserClick: boolean = false,
): Promise<boolean> {
  try {
    const update = await check()

    if (update == null) {
      await message("You're running the latest version!", {
        title: 'No Update Available',
        kind: 'info',
      })

      return false
    }

    // Show dialog with update information
    const shouldInstall = await ask(
      `A new version (${update.version}) is available. Would you like to install it now?`,
      {
        title: 'Update Available',
        kind: 'info',
        okLabel: 'Install',
        cancelLabel: 'Later',
      },
    )

    if (!shouldInstall) {
      return false
    }

    await updateApp(update)

    return true
  } catch (error) {
    // Log error silently, only show dialog if user initiated the check
    if (onUserClick) {
      await message(`Failed to check for updates. Please try again later.`, {
        title: 'Update Check Error',
        kind: 'error',
      })
    }

    logEvent(
      'ERROR',
      'updater',
      `Failed to check for updates: ${(error as Error).message}`,
      {
        stack: (error as Error).stack || null,
      },
    )

    return false
  }
}

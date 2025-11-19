import { useMutation } from '@tanstack/react-query'
import { checkForUpdates, checkForUpdatesWithPrompt } from './updater'

interface UseCheckForUpdatesWithPromptOptions {
  onUserClick?: boolean
}

/**
 * Custom hook for silent background update checking
 * Useful for checking on app startup without user interruption
 * Returns true if an update is available
 */
export function useCheckForUpdates() {
  return useMutation({
    mutationFn: async () => checkForUpdates(),
  })
}

/**
 * Custom hook for checking and installing updates with user prompts
 * Shows dialogs for user interaction
 * Uses React Query for state management
 */
export function useCheckForUpdatesWithPrompt() {
  return useMutation({
    mutationFn: async (options: UseCheckForUpdatesWithPromptOptions = {}) =>
      checkForUpdatesWithPrompt(options.onUserClick ?? false),
  })
}

import { useMutation } from '@tanstack/react-query'
import { checkForUpdates } from './updater'

interface UseCheckForUpdatesOptions {
  onUserClick?: boolean
}

/**
 * Custom hook for checking and installing updates
 * Uses React Query for state management
 */
export function useCheckForUpdates() {
  return useMutation({
    mutationFn: async (options: UseCheckForUpdatesOptions = {}) => {
      return await checkForUpdates(options.onUserClick ?? false)
    },
  })
}

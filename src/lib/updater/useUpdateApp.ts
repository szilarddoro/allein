import { updateApp } from '@/lib/updater/updater'
import { useMutation } from '@tanstack/react-query'
import { Update } from '@tauri-apps/plugin-updater'

/**
 * Custom hook for updating and restarting the app.
 */
export function useUpdateApp() {
  return useMutation({
    mutationFn: async (update: Update | null) => updateApp(update),
  })
}

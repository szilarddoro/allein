import { ConfigModel, updateConfig } from '@/lib/db/database'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/lib/useToast'
import { useLogger } from '@/lib/logging/useLogger'

export interface UpdateConfigOptions {
  onSuccess?: () => void
}

export function useUpdateConfig({ onSuccess }: UpdateConfigOptions = {}) {
  const { toast } = useToast()
  const logger = useLogger()

  return useMutation({
    mutationFn: async ({ key, value }: Pick<ConfigModel, 'key' | 'value'>) => {
      try {
        return updateConfig({ key, value })
      } catch {
        toast.error('Failed to update preferences.')
        throw new Error('Failed to update preferences.')
      }
    },
    onSuccess,
    onError: (error) => {
      logger.error(
        'preferences',
        `Failed to update preferences: ${error.message}`,
        {
          stack: error.stack || null,
        },
      )
    },
  })
}

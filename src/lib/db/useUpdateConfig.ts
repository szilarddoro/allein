import { ConfigModel, updateConfig } from '@/lib/db/database'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/lib/useToast'

export interface UpdateConfigOptions {
  onSuccess?: () => void
}

export function useUpdateConfig({ onSuccess }: UpdateConfigOptions = {}) {
  const { toast } = useToast()

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
  })
}

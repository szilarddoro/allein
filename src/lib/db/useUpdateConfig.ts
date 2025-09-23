import { ConfigModel, updateConfig } from '@/lib/db/database'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/lib/useToast'

export function useUpdateConfig({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ key, value }: Pick<ConfigModel, 'key' | 'value'>) => {
      try {
        const result = await updateConfig({ key, value })
        toast.success('Preferences updated successfully.')
        return result
      } catch {
        toast.error('Failed to update preferences.')
        throw new Error('Failed to update preferences.')
      }
    },
    onSuccess,
  })
}

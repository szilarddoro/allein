import { OnboardingStatus, updateOnboardingStatus } from '@/lib/db/database'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ONBOARDING_PROGRESS_QUERY_KEY } from './useOnboardingProgress'
import { useLogger } from '@/lib/logging/useLogger'

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient()
  const logger = useLogger()

  return useMutation({
    mutationFn: async ({
      status,
      currentStep,
    }: {
      status: OnboardingStatus
      currentStep: number
    }) => {
      return updateOnboardingStatus(status, currentStep)
    },
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({
          queryKey: [ONBOARDING_PROGRESS_QUERY_KEY],
        })
      } catch {
        // silently ignore invalidation errors
      }
    },
    onError: (error) => {
      logger.error(
        'onboarding',
        `Failed to update onboarding progress: ${error.message}`,
        {
          stack: error.stack || null,
        },
      )
    },
  })
}

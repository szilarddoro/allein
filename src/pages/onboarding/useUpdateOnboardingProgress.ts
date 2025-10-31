import { OnboardingStatus, updateOnboardingStatus } from '@/lib/db/database'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ONBOARDING_PROGRESS_QUERY_KEY } from './useOnboardingProgress'

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient()

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
  })
}

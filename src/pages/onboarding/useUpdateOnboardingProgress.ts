import { getDatabase } from '@/lib/db/database'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ONBOARDING_PROGRESS_QUERY_KEY,
  OnboardingStatus,
} from './useOnboardingProgress'

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
      const database = await getDatabase()
      return database.execute(
        `INSERT INTO onboarding (id, status, current_step, created_at, updated_at)
         VALUES (1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           current_step = excluded.current_step,
           updated_at = CURRENT_TIMESTAMP`,
        [status, currentStep],
      )
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

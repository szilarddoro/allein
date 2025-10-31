import { getOnboardingStatus } from '@/lib/db/database'
import { useQuery } from '@tanstack/react-query'

export const ONBOARDING_PROGRESS_QUERY_KEY = 'onboarding-progress'

export function useOnboardingProgress() {
  return useQuery({
    queryKey: [ONBOARDING_PROGRESS_QUERY_KEY],
    queryFn: async () => {
      return getOnboardingStatus()
    },
  })
}

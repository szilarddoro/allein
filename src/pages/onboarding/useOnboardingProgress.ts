import { getDatabase } from '@/lib/db/database'
import { useQuery } from '@tanstack/react-query'

export const ONBOARDING_PROGRESS_QUERY_KEY = 'onboarding-progress'

export type OnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'

export interface OnboardingProgress {
  id: number
  status: OnboardingStatus
  current_step: number
  created_at: string
  updated_at: string
}

export function useOnboardingProgress() {
  return useQuery({
    queryKey: [ONBOARDING_PROGRESS_QUERY_KEY],
    queryFn: async () => {
      const database = await getDatabase()
      const result = await database.select<OnboardingProgress[]>(
        'SELECT * FROM onboarding WHERE id = 1',
      )
      return result[0] || { status: 'not_started', current_step: 0 }
    },
  })
}

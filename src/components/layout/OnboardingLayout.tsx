import { BaseLayout } from '@/components/layout/BaseLayout'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { useOnboardingProgress } from '@/pages/onboarding/useOnboardingProgress'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'

export function OnboardingLayout() {
  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const navigate = useNavigate()

  useEffect(() => {
    if (progress?.status === 'completed' || progress?.status === 'skipped') {
      navigate('/')
    }
  }, [navigate, progress])

  if (progressStatus === 'pending') {
    return null
  }

  return (
    <BaseLayout>
      <header className="relative flex justify-end items-center gap-0.5 px-2 py-2 h-16">
        <TauriDragRegion />
      </header>

      <main className="flex-auto overflow-hidden flex">
        <div className="flex-1 flex flex-col overflow-auto">
          <Outlet />
        </div>
      </main>
    </BaseLayout>
  )
}

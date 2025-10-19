import { BaseLayout } from '@/components/layout/BaseLayout'
import { TauriDragRegion } from '@/components/TauriDragRegion'
import { Button } from '@/components/ui/button'
import { useWindowState } from '@/hooks/useWindowState'
import { cn } from '@/lib/utils'
import { useOnboardingProgress } from '@/pages/onboarding/useOnboardingProgress'
import { useUpdateOnboardingProgress } from '@/pages/onboarding/useUpdateOnboardingProgress'
import { ArrowLeft } from 'lucide-react'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'

export interface OnboardingLayoutContext {
  currentStep: number
  setCurrentStep: Dispatch<SetStateAction<number>>
}

export function OnboardingLayout() {
  const [currentStep, setCurrentStep] = useState(0)
  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const { mutateAsync: updateOnboardingProgress } =
    useUpdateOnboardingProgress()
  const navigate = useNavigate()
  const { isFullscreen } = useWindowState()

  // Sync local step state with database
  useEffect(() => {
    if (progress?.current_step !== undefined) {
      setCurrentStep(progress.current_step)
    }
  }, [progress?.current_step])

  useEffect(() => {
    if (progress?.status === 'completed' || progress?.status === 'skipped') {
      navigate('/')
    }
  }, [navigate, progress])

  function handleGoBack() {
    if (currentStep === 0) {
      return
    }

    updateOnboardingProgress({
      currentStep: currentStep - 1,
      status: currentStep === 0 ? 'not_started' : 'in_progress',
    })

    setCurrentStep((step) => step - 1)
  }

  if (progressStatus === 'pending' || progress?.status === 'completed') {
    return null
  }

  return (
    <BaseLayout>
      <header className="relative flex justify-start items-center gap-0.5 px-2 py-2 h-16">
        <TauriDragRegion />

        <div
          className={cn(
            'px-2 z-10 translate-y-full motion-safe:transition-opacity opacity-0',
            currentStep > 0 && 'opacity-100',
            isFullscreen && 'translate-y-0',
          )}
        >
          <Button size="icon" variant="ghost" onClick={handleGoBack}>
            <ArrowLeft />
          </Button>
        </div>
      </header>

      <main className="flex-auto overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col overflow-auto">
          <Outlet
            context={
              {
                currentStep,
                setCurrentStep,
              } as OnboardingLayoutContext
            }
          />
        </div>
      </main>
    </BaseLayout>
  )
}

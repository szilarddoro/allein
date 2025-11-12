import { OnboardingLayoutContext } from '@/components/layout/OnboardingLayout'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useToast } from '@/lib/useToast'
import { FinalStep } from '@/pages/onboarding/steps/FinalStep'
import { useOutletContext } from 'react-router'
import { WelcomeStep } from './steps/WelcomeStep'
import { useUpdateOnboardingProgress } from './useUpdateOnboardingProgress'
import {
  DownloadModelsStep,
  DownloadModelsSubmitData,
} from '@/pages/onboarding/steps/DownloadModelsStep'
import { useLogger } from '@/lib/logging/useLogger'

export function OnboardingPage() {
  const { currentStep, setCurrentStep } =
    useOutletContext<OnboardingLayoutContext>()
  const { toast } = useToast()
  const logger = useLogger()

  const { mutateAsync: updateProgress } = useUpdateOnboardingProgress()

  const { refetchConfig } = useOllamaConfig()
  const { mutateAsync: updateConfig } = useUpdateConfig({
    onSuccess: refetchConfig,
  })

  async function handleSkip() {
    await updateProgress({ status: 'skipped', currentStep: 0 })
    logger.info('onboarding', 'Skipped onboarding', { currentStep })
  }

  function handleNext() {
    updateProgress({ status: 'in_progress', currentStep: currentStep + 1 })
    setCurrentStep((prev) => prev + 1)
  }

  async function handleSaveAIConfig(values: DownloadModelsSubmitData) {
    try {
      await Promise.all([
        updateConfig({
          key: 'ai_assistance_enabled',
          value: 'true',
        }),
        updateConfig({
          key: 'ollama_url',
          value: values.serverUrl || '',
        }),
        updateConfig({
          key: 'completion_model',
          value: values.completionModel || '',
        }),
        updateConfig({
          key: 'improvement_model',
          value: values.improvementModel || '',
        }),
      ])

      handleNext()
    } catch {
      toast.error('Failed to update preferences')
    }
  }

  async function handleFinish() {
    try {
      await updateProgress({ status: 'completed', currentStep: 0 })
    } catch (error) {
      logger.error(
        'onboarding',
        `Failed to complete onboarding: ${(error as Error).message}`,
        { stack: (error as Error)?.stack || null },
      )
      toast.error('Failed to complete onboarding')
    }
  }

  if (currentStep === 0) {
    return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
  }

  if (currentStep === 1) {
    return <DownloadModelsStep onNext={handleSaveAIConfig} />
  }

  return <FinalStep onNext={handleFinish} />
}

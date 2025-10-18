import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { WelcomeStep } from './steps/WelcomeStep'
import { useOnboardingProgress } from './useOnboardingProgress'
import { useUpdateOnboardingProgress } from './useUpdateOnboardingProgress'
import { AIAssistantStep } from '@/pages/onboarding/steps/AIAssistantStep'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { AssistantSettingsFormValues } from '@/components/ollama/AIAssistantConfigPanel'
import { useToast } from '@/lib/useToast'

const TOTAL_STEPS = 2

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: progress, status: progressStatus } = useOnboardingProgress()
  const { mutateAsync: updateProgress } = useUpdateOnboardingProgress()

  const { refetchConfig } = useOllamaConfig()
  const { mutateAsync: updateConfig } = useUpdateConfig({
    onSuccess: refetchConfig,
  })

  // Sync local step state with database
  useEffect(() => {
    if (progress?.current_step !== undefined) {
      setCurrentStep(progress.current_step)
    }
  }, [progress?.current_step])

  function handleSkip() {
    updateProgress({ status: 'skipped', currentStep: 0 })
    navigate('/')
  }

  function handleNext() {
    if (currentStep === TOTAL_STEPS - 1) {
      updateProgress({ status: 'completed', currentStep: 0 })
      navigate('/')
    } else {
      updateProgress({ status: 'in_progress', currentStep: currentStep + 1 })
      setCurrentStep((prev) => prev + 1)
    }
  }

  async function handleFinish(values: AssistantSettingsFormValues) {
    try {
      await Promise.all([
        // Update AI assistance enabled state
        updateConfig({
          key: 'ai_assistance_enabled',
          value: values.aiAssistantEnabled ? 'true' : 'false',
        }),

        // Update Ollama configuration
        updateConfig({ key: 'ollama_url', value: values.serverUrl || null }),
        updateConfig({ key: 'ollama_model', value: values.model || null }),

        // Mark onboarding as completed
        updateProgress({
          status: 'completed',
          currentStep: 0,
        }),
      ])

      toast.info('Welcome to Allein!')
    } catch {
      toast.error('Failed to update settings.')
    }
  }

  if (progressStatus === 'pending') {
    return null
  }

  if (currentStep === 1) {
    return <AIAssistantStep onNext={handleFinish} onSkip={handleSkip} />
  }

  return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
}

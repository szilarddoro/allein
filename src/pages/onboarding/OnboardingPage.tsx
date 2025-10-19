import { OnboardingLayoutContext } from '@/components/layout/OnboardingLayout'
import { AssistantSettingsFormValues } from '@/components/ollama/AIAssistantConfigPanel'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useToast } from '@/lib/useToast'
import { AIAssistantStep } from '@/pages/onboarding/steps/AIAssistantStep'
import { FinalStep } from '@/pages/onboarding/steps/FinalStep'
import { useNavigate, useOutletContext } from 'react-router'
import { WelcomeStep } from './steps/WelcomeStep'
import { useUpdateOnboardingProgress } from './useUpdateOnboardingProgress'

export function OnboardingPage() {
  const { currentStep, setCurrentStep } =
    useOutletContext<OnboardingLayoutContext>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { mutateAsync: updateProgress } = useUpdateOnboardingProgress()

  const { refetchConfig } = useOllamaConfig()
  const { mutateAsync: updateConfig } = useUpdateConfig({
    onSuccess: refetchConfig,
  })

  function handleSkip() {
    updateProgress({ status: 'skipped', currentStep: 0 })
    navigate('/')
  }

  function handleNext() {
    updateProgress({ status: 'in_progress', currentStep: currentStep + 1 })
    setCurrentStep((prev) => prev + 1)
  }

  async function handleSaveAIConfig(values: AssistantSettingsFormValues) {
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
      ])

      handleNext()
    } catch {
      toast.error('Failed to update settings')
    }
  }

  async function handleFinish() {
    try {
      await updateProgress({
        status: 'completed',
        currentStep: 0,
      })
    } catch {
      toast.error('Failed to complete onboarding')
    }
  }

  if (currentStep === 0) {
    return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
  }

  if (currentStep === 1) {
    return <AIAssistantStep onNext={handleSaveAIConfig} onSkip={handleSkip} />
  }

  return <FinalStep onNext={handleFinish} />
}

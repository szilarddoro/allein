import alleinLogo from '@/assets/allein-logo.png'
import inlineCompletionPreview from '@/assets/inline-completion-preview.png'
import { H1 } from '@/components/ui/typography'
import {
  AIAssistantConfigPanel,
  AssistantSettingsFormValues,
} from '@/components/ollama/AIAssistantConfigPanel'

export interface AIAssistantStepProps {
  onNext: (values: AssistantSettingsFormValues) => void
  onSkip?: () => void
}

export function AIAssistantStep({ onNext, onSkip }: AIAssistantStepProps) {
  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 justify-center items-center flex-1 pt-4 pb-16 px-4">
      <div className="flex flex-col items-center justify-center motion-safe:animate-fade-in">
        <img
          draggable={false}
          src={alleinLogo}
          width={1024}
          height={1024}
          alt="Letter A in a rounded rectangle"
          className="size-16 mb-2"
        />

        <H1 className="my-0 text-3xl font-bold mb-1 text-center">
          Configure the AI Assistant
        </H1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <img
          draggable={false}
          src={inlineCompletionPreview}
          width={900}
          height={550}
          alt="A desktop application showcasing inline suggestions"
          className="mx-auto max-w-xl w-full object-cover border-2 border-transparent dark:border-input rounded-md motion-safe:animate-fade-in delay-200 order-2 md:order-1"
        />

        <div className="order-1 md:order-2 px-2">
          <AIAssistantConfigPanel onSubmit={onNext} onSkip={onSkip} />
        </div>
      </div>
    </div>
  )
}

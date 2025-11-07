import {
  AIAssistantConfigPanel,
  AssistantSettingsFormValues,
} from '@/components/ollama/AIAssistantConfigPanel'
import { Card, CardContent } from '@/components/ui/card'
import { useConfig } from '@/lib/db/useConfig'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'

export function AIAssistantCard() {
  const [isFormDirty, setIsFormDirty] = useState(false)
  const { refetch: refetchConfig } = useConfig()
  const { mutateAsync: updateConfig } = useUpdateConfig({
    onSuccess: refetchConfig,
  })

  async function handleSubmit(values: AssistantSettingsFormValues) {
    try {
      await Promise.all([
        // Update AI assistance enabled state
        updateConfig({
          key: 'ai_assistance_enabled',
          value: values.aiAssistantEnabled ? 'true' : 'false',
        }),

        // Update Ollama configuration
        updateConfig({ key: 'ollama_url', value: values.serverUrl || null }),
        updateConfig({
          key: 'completion_model',
          value: values.completionModel || null,
        }),
        updateConfig({
          key: 'improvement_model',
          value: values.improvementModel || null,
        }),
      ])

      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to update preferences')
    }
  }

  return (
    <Card
      className={cn(
        'motion-safe:transition-colors',
        isFormDirty && 'border-blue-500/50 dark:border-blue-300/50',
      )}
    >
      <CardContent>
        <AIAssistantConfigPanel
          onSubmit={handleSubmit}
          onDirtyChange={setIsFormDirty}
          submitLabel={{ label: 'Save' }}
          footerClassName="w-full justify-start border-t border-input/80 -mt-3 pt-4"
          disableAnimations
          disableSkip
          placement="settings"
        />
      </CardContent>
    </Card>
  )
}

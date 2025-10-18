import {
  AIAssistantConfigPanel,
  AssistantSettingsFormValues,
} from '@/components/ollama/AIAssistantConfigPanel'
import { Card, CardContent } from '@/components/ui/card'
import { useConfig } from '@/lib/db/useConfig'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { toast } from 'sonner'

export function AIAssistantCard() {
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
        updateConfig({ key: 'ollama_model', value: values.model || null }),
      ])

      toast.success('Settings saved')
    } catch {
      toast.error('Failed to update settings.')
    }
  }

  return (
    <Card>
      <CardContent>
        <AIAssistantConfigPanel
          onSubmit={handleSubmit}
          submitLabel={{ label: 'Save' }}
          disableSkip
          footerClassName="w-full justify-end"
        />
      </CardContent>
    </Card>
  )
}

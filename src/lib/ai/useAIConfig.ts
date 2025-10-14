import { useConfig } from '@/lib/db/useConfig'

export function useAIConfig() {
  const { data: config } = useConfig()

  const aiAssistanceEnabledConfigValue = config?.find(
    (c) => c.key === 'ai_assistance_enabled',
  )?.value
  const aiAssistanceEnabled =
    aiAssistanceEnabledConfigValue == null
      ? null
      : aiAssistanceEnabledConfigValue === 'true'

  return { aiAssistanceEnabled }
}

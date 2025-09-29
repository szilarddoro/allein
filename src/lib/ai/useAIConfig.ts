import { useConfig } from '@/lib/db/useConfig'

export function useAIConfig() {
  const { data: config } = useConfig()

  const aiAssistanceEnabled =
    config?.find((c) => c.key === 'ai_assistance_enabled')?.value === 'true'

  return { aiAssistanceEnabled }
}

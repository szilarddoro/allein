import { useConfig } from '@/lib/db/useConfig'

export function useOllamaConfig() {
  const { data: config } = useConfig()

  const ollamaUrl = config?.find((c) => c.key === 'ollama_url')?.value || null
  const ollamaModel =
    config?.find((c) => c.key === 'ollama_model')?.value || null

  return { ollamaUrl, ollamaModel }
}

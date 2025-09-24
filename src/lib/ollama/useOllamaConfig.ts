import { useConfig } from '@/lib/db/useConfig'
import { createOllama } from 'ollama-ai-provider-v2'
import { useMemo } from 'react'
import { DEFAULT_OLLAMA_URL } from './ollama'

export function useOllamaConfig() {
  const { data: config } = useConfig()

  const ollamaUrl = config?.find((c) => c.key === 'ollama_url')?.value || null
  const ollamaModel =
    config?.find((c) => c.key === 'ollama_model')?.value || null

  const ollamaProvider = useMemo(
    () =>
      createOllama({
        baseURL: `${ollamaUrl || DEFAULT_OLLAMA_URL}/api`,
      }),
    [ollamaUrl],
  )

  return { ollamaUrl, ollamaModel, ollamaProvider }
}

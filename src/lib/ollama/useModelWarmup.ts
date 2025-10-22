import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useQuery } from '@tanstack/react-query'

export const OLLAMA_WARMUP_BASE_QUERY_KEY = 'ollama-warmup'

/**
 * Warms up the Ollama model by sending a minimal generation request
 * This loads the model into memory and keeps it ready for subsequent requests
 */
async function warmupModel(
  ollamaUrl: string,
  modelName: string,
): Promise<boolean> {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({
      model: modelName,
    }),
  })

  return response.ok
}

export function useModelWarmup() {
  const { aiAssistanceEnabled } = useAIConfig()
  const { ollamaUrl, ollamaModel } = useOllamaConfig()

  return useQuery({
    queryKey: [OLLAMA_WARMUP_BASE_QUERY_KEY, ollamaUrl, ollamaModel],
    queryFn: () => warmupModel(ollamaUrl!, ollamaModel!),
    enabled: (aiAssistanceEnabled ?? false) && !!ollamaUrl && !!ollamaModel,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
    staleTime: Infinity, // Data never goes stale
  })
}

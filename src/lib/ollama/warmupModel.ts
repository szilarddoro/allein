import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useQuery } from '@tanstack/react-query'

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
      options: {
        keep_alive: '5m',
      },
    }),
  })

  return response.ok
}

export function useModelWarmup() {
  const { aiAssistanceEnabled } = useAIConfig()
  const { ollamaUrl, ollamaModel } = useOllamaConfig()

  return useQuery({
    queryKey: ['ollama-warmup', ollamaUrl, ollamaModel],
    queryFn: () => warmupModel(ollamaUrl!, ollamaModel!),
    enabled: (aiAssistanceEnabled ?? false) && !!ollamaUrl && !!ollamaModel,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: Infinity, // Data never goes stale
  })
}

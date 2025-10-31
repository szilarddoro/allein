import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useQuery } from '@tanstack/react-query'

export const OLLAMA_WARMUP_BASE_QUERY_KEY = 'ollama-warmup'

async function warmupCompletionModel(
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

export function useWarmupCompletionModel() {
  const { aiAssistanceEnabled } = useAIConfig()
  const { ollamaUrl, completionModel } = useOllamaConfig()

  return useQuery({
    queryKey: [OLLAMA_WARMUP_BASE_QUERY_KEY, ollamaUrl, completionModel],
    queryFn: () => warmupCompletionModel(ollamaUrl!, completionModel!),
    enabled: (aiAssistanceEnabled ?? false) && !!ollamaUrl && !!completionModel,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
    staleTime: Infinity, // Data never goes stale
  })
}

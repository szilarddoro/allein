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
    }),
  })

  return response.ok
}

/**
 * React hook to warm up and keep the Ollama model loaded
 * Uses continuous refetching to maintain model in memory
 */
export function useModelWarmup(
  ollamaUrl: string | null,
  modelName: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['ollama-warmup', ollamaUrl, modelName],
    queryFn: () => warmupModel(ollamaUrl!, modelName!),
    enabled: enabled && !!ollamaUrl && !!modelName,
    refetchInterval: 1 * 60 * 1000,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: Infinity, // Data never goes stale
  })
}

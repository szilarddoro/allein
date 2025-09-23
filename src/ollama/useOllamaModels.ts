import { useQuery } from '@tanstack/react-query'
import { fetchOllamaModels } from '@/ollama/ollama'

export function useOllamaModels(serverUrl: string) {
  return useQuery({
    queryKey: ['ollama-models', serverUrl],
    queryFn: () => fetchOllamaModels(serverUrl),
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!serverUrl, // Only run query if serverUrl is provided
  })
}

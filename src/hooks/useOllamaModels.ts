import { useQuery } from '@tanstack/react-query'
import { fetchOllamaModels, testOllamaConnection } from '@/lib/ollama'

export function useOllamaModels(serverUrl: string) {
  return useQuery({
    queryKey: ['ollama-models', serverUrl],
    queryFn: () => fetchOllamaModels(serverUrl),
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!serverUrl, // Only run query if serverUrl is provided
  })
}

export function useOllamaConnection(serverUrl: string) {
  return useQuery({
    queryKey: ['ollama-connection', serverUrl],
    queryFn: () => testOllamaConnection(serverUrl),
    retry: false,
    refetchInterval: 10000, // Check connection every 10 seconds
    enabled: !!serverUrl, // Only run query if serverUrl is provided
  })
}

import { testOllamaConnection } from '@/ollama/ollama'
import { useQuery } from '@tanstack/react-query'

export function useOllamaConnection(serverUrl?: string | null) {
  return useQuery({
    queryKey: ['ollama-connection', serverUrl],
    queryFn: () => testOllamaConnection(serverUrl || ''),
    retry: false,
    refetchInterval: 10000, // Check connection every 10 seconds
    enabled: !!serverUrl, // Only run query if serverUrl is provided
  })
}

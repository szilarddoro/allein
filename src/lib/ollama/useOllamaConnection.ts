import { useQuery } from '@tanstack/react-query'
import { DEFAULT_OLLAMA_URL } from './ollama'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'

// Test Ollama server connection
export async function testOllamaConnection(
  serverUrl: string = DEFAULT_OLLAMA_URL,
): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/api/tags`, {
      method: 'HEAD',
    })
    return response.ok
  } catch {
    return false
  }
}

export function useOllamaConnection(serverUrl?: string | null) {
  const { ollamaUrl } = useOllamaConfig()

  return useQuery({
    queryKey: ['ollama-connection', ollamaUrl || serverUrl],
    queryFn: () => testOllamaConnection(ollamaUrl || serverUrl || ''),
    retry: false,
    refetchInterval: 10000,
    enabled: !!serverUrl && !!ollamaUrl,
  })
}

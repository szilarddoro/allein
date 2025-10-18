import { useQuery } from '@tanstack/react-query'
import { DEFAULT_OLLAMA_URL } from './ollama'

export const OLLAMA_CONNECTION_QUERY_KEY = (serverUrl: string) => [
  'ollama-connection',
  serverUrl,
]

// Test Ollama server connection
export async function testOllamaConnection(
  serverUrl: string = DEFAULT_OLLAMA_URL,
): Promise<boolean> {
  try {
    const url = new URL(serverUrl)
    const response = await fetch(
      `${url.toString().replace(/\/$/, '')}/api/tags`,
      {
        method: 'HEAD',
      },
    )

    if (!response.ok) {
      throw new Error('Connection cannot be established.')
    }

    return response.ok
  } catch {
    return false
  }
}

export function useOllamaConnection(
  serverUrl?: string | null,
  disabled?: boolean,
) {
  const targetServerUrl = serverUrl || ''

  return useQuery({
    queryKey: OLLAMA_CONNECTION_QUERY_KEY(targetServerUrl),
    queryFn: () => testOllamaConnection(targetServerUrl),
    retry: false,
    refetchInterval: 10000,
    enabled: !!targetServerUrl && !disabled,
    refetchOnMount: 'always',
  })
}

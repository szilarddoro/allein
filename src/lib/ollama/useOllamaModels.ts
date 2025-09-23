import { useQuery } from '@tanstack/react-query'
import { DEFAULT_OLLAMA_URL } from './ollama'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

// Fetch available models from Ollama
export async function fetchOllamaModels(
  serverUrl: string = DEFAULT_OLLAMA_URL,
): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${serverUrl}/api/tags`)

    if (!response.ok) {
      throw new Error(`Ollama server responded with ${response.status}`)
    }

    const data: OllamaModelsResponse = await response.json()
    return data.models || []
  } catch {
    throw new Error(
      'Failed to connect to Ollama server. Make sure Ollama is running.',
    )
  }
}

export function useOllamaModels(serverUrl?: string | null) {
  return useQuery({
    queryKey: ['ollama-models', serverUrl],
    queryFn: () => fetchOllamaModels(serverUrl || ''),
    retry: false,
    refetchInterval: 30000,
    enabled: !!serverUrl,
  })
}

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

export const OLLAMA_MODEL_BASE_QUERY_KEY = 'ollama-model'
export const OLLAMA_MODEL_QUERY_KEY = (serverUrl: string) => [
  OLLAMA_MODEL_BASE_QUERY_KEY,
  serverUrl,
]

// Fetch available models from Ollama
export async function fetchOllamaModels(
  serverUrl: string = DEFAULT_OLLAMA_URL,
): Promise<OllamaModel[]> {
  try {
    const url = new URL(serverUrl)
    const response = await fetch(
      `${url.toString().replace(/\/$/, '')}/api/tags`,
    )

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

export function useOllamaModels(serverUrl?: string | null, disabled?: boolean) {
  const targetServerUrl = serverUrl || ''

  return useQuery({
    queryKey: OLLAMA_MODEL_QUERY_KEY(targetServerUrl),
    queryFn: () => fetchOllamaModels(targetServerUrl),
    retry: false,
    enabled: !disabled,
  })
}

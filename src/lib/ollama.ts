// Ollama API types and functions
export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

export interface OllamaError {
  error: string
}

// Default Ollama server URL
const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

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

import {
  useQuery,
  experimental_streamedQuery as streamedQuery,
} from '@tanstack/react-query'

export interface UsePullOllamaModelProps {
  serverUrl?: string
  model?: string
  disabled?: boolean
}

export interface PullModelResponseChunk {
  status: string | 'success'
  digest?: string
  total?: number
  completed?: number
}

export function usePullOllamaModel(
  { serverUrl, model, disabled }: UsePullOllamaModelProps = { disabled: false },
) {
  return useQuery<PullModelResponseChunk[]>({
    queryKey: ['model-status', serverUrl, model],
    queryFn: streamedQuery({
      streamFn: ({ signal }) => {
        return {
          async *[Symbol.asyncIterator]() {
            if (!serverUrl) {
              throw new Error('Server URL is required to pull model')
            }

            const url = new URL(serverUrl)
            const response = await fetch(
              `${url.toString().replace(/\/$/, '')}/api/pull`,
              {
                method: 'POST',
                body: JSON.stringify({
                  model,
                }),
                signal,
              },
            )

            if (!response.ok) {
              throw new Error('Failed to download the model.')
            }

            const body = response.body

            if (body == null) {
              throw new Error('Failed to download the model.')
            }

            const reader = body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const json = JSON.parse(line)
                    yield json
                  } catch {
                    // Failed to parse JSON line
                  }
                }
              }
            }

            // Handle any remaining content in buffer
            if (buffer.trim()) {
              try {
                yield JSON.parse(buffer)
              } catch {
                // Failed to parse final buffer
              }
            }

            reader.releaseLock()
          },
        }
      },
    }),
    staleTime: 0,
    gcTime: 0,
    enabled: !!serverUrl && !!model && !disabled,
  })
}

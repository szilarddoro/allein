import { FILES_QUERY_KEY } from '@/lib/files/useFileList'
import { FILES_WITH_PREVIEW_QUERY_KEY } from '@/lib/files/useFileListWithPreview'
import { READ_FILE_BASE_QUERY_KEY } from '@/lib/files/useReadFile'
import { OLLAMA_WARMUP_BASE_QUERY_KEY } from '@/lib/ollama/useWarmupCompletionModel'
import { OLLAMA_MODEL_BASE_QUERY_KEY } from '@/lib/ollama/useOllamaModels'
import { useQueryClient } from '@tanstack/react-query'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef } from 'react'

export function useInvalidateQueriesOnWindowFocus() {
  const queryClient = useQueryClient()
  const lastRefetchTime = useRef<number | null>(null)

  // Listen for Tauri window events
  useEffect(() => {
    let unlisten: () => void | undefined

    const setupListeners = async () => {
      unlisten = await listen('tauri://focus', async () => {
        if (
          lastRefetchTime.current &&
          Date.now() - lastRefetchTime.current < 1000
        ) {
          return
        }

        lastRefetchTime.current = Date.now()

        try {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: FILES_QUERY_KEY(),
            }),
            queryClient.invalidateQueries({
              queryKey: FILES_WITH_PREVIEW_QUERY_KEY(),
            }),
            queryClient.invalidateQueries({
              predicate: (query) =>
                query.queryKey.includes(READ_FILE_BASE_QUERY_KEY),
            }),
            queryClient.invalidateQueries({
              predicate: (query) =>
                query.queryKey.includes(OLLAMA_MODEL_BASE_QUERY_KEY),
            }),
            queryClient.invalidateQueries({
              queryKey: [OLLAMA_WARMUP_BASE_QUERY_KEY],
            }),
          ])
        } catch {
          // silently ignore invalidation errors
        }
      })
    }

    setupListeners()

    return () => unlisten?.()
  }, [queryClient])
}

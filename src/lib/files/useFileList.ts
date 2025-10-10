import { useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { FileInfo } from './types'
import { useEffect, useRef } from 'react'
import { listen } from '@tauri-apps/api/event'

export const FILES_QUERY_KEY = () => ['files']

export function useFileList() {
  const queryClient = useQueryClient()
  const lastRefetchTime = useRef<number | null>(null)

  const queryData = useQuery({
    queryKey: FILES_QUERY_KEY(),
    queryFn: () => invoke<FileInfo[]>('list_files'),
    retry: 3,
  })

  // Listen for Tauri window events
  useEffect(() => {
    let unlisten: () => void | undefined

    const setupListeners = async () => {
      unlisten = await listen('tauri://focus', () => {
        if (
          lastRefetchTime.current &&
          Date.now() - lastRefetchTime.current < 1000
        ) {
          return
        }

        lastRefetchTime.current = Date.now()
        queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY() })
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey.includes('file'),
        })
      })
    }

    setupListeners()

    return () => unlisten?.()
  }, [queryClient])

  return queryData
}

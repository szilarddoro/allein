import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaModelDetails } from '@/lib/ollama/useOllamaModelDetails'
import { usePullOllamaModel } from '@/lib/ollama/usePullOllamaModel'
import { useEffect, useState } from 'react'

export interface UsePullModelWithStatusProps {
  model?: string
  disabled?: boolean
  connected?: boolean
}

export function usePullModelWithStatus({
  model,
  disabled,
  connected,
}: UsePullModelWithStatusProps) {
  const { ollamaUrl } = useOllamaConfig()

  const { data: modelDetails, status: modelDetailsStatus } =
    useOllamaModelDetails({
      serverUrl: ollamaUrl,
      model,
      disabled: !connected,
    })

  // We disable pulling the model if:
  // - pulling is disabled via props
  // - the model details have been fetched and the model exists (i.e., not missing)
  const isPullDisabled =
    disabled || (modelDetails && !('status' in modelDetails))

  const [modelStatus, setModelStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle')

  const [modelProgress, setModelProgress] = useState(0)

  const { data, error, status } = usePullOllamaModel({
    serverUrl: ollamaUrl,
    model,
    disabled: isPullDisabled,
  })

  const lastModelStatus = [...(data || [])].pop()

  useEffect(() => {
    // We are considering this scenario as a network issue, because stream data is missing
    if (status === 'success' && data && !Array.isArray(data)) {
      setModelStatus('error')
    }
  }, [data, status])

  useEffect(() => {
    if (modelStatus === 'idle' && !disabled) {
      setModelStatus('pending')
    }
  }, [disabled, modelStatus])

  useEffect(() => {
    if (modelStatus === 'pending' && lastModelStatus?.status === 'success') {
      setModelStatus('success')
      setModelProgress(100)
    }
  }, [modelStatus, lastModelStatus])

  useEffect(() => {
    // Returning because we already succeeded or errored out
    if (modelStatus === 'success' || modelStatus === 'error' || data == null) {
      return
    }

    const lastChunkWithDownloadProgress = data
      .reverse()
      .find((chunk) => chunk.total != null && chunk.completed != null)

    if (lastChunkWithDownloadProgress) {
      setModelProgress(
        Math.ceil(
          (lastChunkWithDownloadProgress.completed! /
            lastChunkWithDownloadProgress.total!) *
            100,
        ),
      )
    }
  }, [data, modelStatus])

  useEffect(() => {
    if (modelStatus !== 'error' && error != null) {
      setModelStatus('error')
    }
  }, [error, modelStatus])

  useEffect(() => {
    // Returning because model details are still pending
    if (modelDetailsStatus === 'pending') {
      return
    }

    // Returning because model details are missing (i.e., model is not downloaded)
    if (
      !modelDetails ||
      ('status' in modelDetails && modelDetails.status === 'missing')
    ) {
      return
    }

    setModelProgress(100)
    setModelStatus('success')
  }, [modelDetails, modelDetailsStatus])

  return {
    modelStatus:
      modelDetailsStatus === 'pending' ? ('initPending' as const) : modelStatus,
    modelProgress,
    modelError: error,
  }
}

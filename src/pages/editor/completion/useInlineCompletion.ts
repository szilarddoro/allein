/**
 * Hook for registering Monaco inline completion provider
 *
 * Implementation inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useMonaco } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { CompletionProvider } from './CompletionProvider'

export interface UseInlineCompletionOptions {
  debounceDelay?: number
  disabled?: boolean
  onLoadingChange?: (loading: boolean) => void
}

export function useInlineCompletion({
  debounceDelay = 350,
  disabled = false,
  onLoadingChange,
}: UseInlineCompletionOptions = {}) {
  const monacoInstance = useMonaco()
  const { completionModel, ollamaUrl } = useOllamaConfig()
  const { aiAssistanceEnabled } = useAIConfig()
  const { data: isConnected, status: connectionStatus } =
    useOllamaConnection(ollamaUrl)

  const providerRef = useRef<CompletionProvider | null>(null)

  const isAiAssistanceAvailable =
    aiAssistanceEnabled && isConnected && connectionStatus === 'success'

  // Register the provider and update config
  useEffect(() => {
    if (!monacoInstance || disabled) {
      return
    }

    // Create or update the provider
    if (!providerRef.current) {
      providerRef.current = new CompletionProvider({
        ollamaUrl,
        ollamaModel: completionModel,
        isAiAssistanceAvailable: isAiAssistanceAvailable || false,
        debounceDelay,
        onLoadingChange,
      })
      providerRef.current.register(monacoInstance)
    } else {
      // Update config without re-registering
      providerRef.current.updateConfig({
        ollamaUrl,
        ollamaModel: completionModel,
        isAiAssistanceAvailable: isAiAssistanceAvailable || false,
        debounceDelay,
        onLoadingChange,
      })
    }

    return () => {
      // Cleanup on unmount
      if (providerRef.current) {
        providerRef.current.dispose()
        providerRef.current = null
      }
    }
  }, [
    monacoInstance,
    disabled,
    debounceDelay,
    isAiAssistanceAvailable,
    completionModel,
    ollamaUrl,
    onLoadingChange,
  ])
}

import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import * as z from 'zod'

export const assistantSettingsFormValues = z
  .object({
    aiAssistantEnabled: z.boolean().optional(),
    serverUrl: z.string().optional(),
    completionModel: z.string().optional(),
    improvementModel: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If AI assistant is enabled, validate serverUrl and models
    if (data.aiAssistantEnabled) {
      if (!data.serverUrl || data.serverUrl.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Server URL is required when the AI assistant is enabled',
          path: ['serverUrl'],
        })
      } else {
        // Validate URL format
        try {
          new URL(data.serverUrl)
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid URL',
            path: ['serverUrl'],
          })
        }
      }

      if (!data.completionModel || data.completionModel.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Completion model is required when the AI assistant is enabled',
          path: ['completionModel'],
        })
      }

      if (!data.improvementModel || data.improvementModel.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Improvement model is required when the AI assistant is enabled',
          path: ['improvementModel'],
        })
      }
    }
  })

export type AssistantSettingsFormValues = z.infer<
  typeof assistantSettingsFormValues
>

export interface UseAIAssistantFormProps {
  onDirtyChange?: (dirty: boolean) => void
}

export interface UseAIAssistantFormReturn {
  form: ReturnType<typeof useForm<AssistantSettingsFormValues>>
  watchAiAssistantEnabled: boolean | undefined
  debouncedOllamaUrl: string | undefined
  setDebouncedOllamaUrl: (value: string | undefined) => void
  targetOllamaUrl: string | undefined
  isFormDirty: boolean
}

export function useAIAssistantForm({
  onDirtyChange,
}: UseAIAssistantFormProps): UseAIAssistantFormReturn {
  const { ollamaUrl, completionModel, improvementModel, configStatus } =
    useOllamaConfig()
  const { aiAssistanceEnabled } = useAIConfig()
  const formInitializedRef = useRef(false)

  const form = useForm<z.infer<typeof assistantSettingsFormValues>>({
    resolver: zodResolver(assistantSettingsFormValues),
    defaultValues: {
      aiAssistantEnabled:
        aiAssistanceEnabled == null ? true : aiAssistanceEnabled,
      serverUrl: ollamaUrl || 'http://localhost:11434',
      completionModel: completionModel || '',
      improvementModel: improvementModel || '',
    },
  })

  const { reset: formReset } = form
  const isFormDirty = form.formState.isDirty

  // Watch the AI assistant enabled state for conditional disabling
  const watchAiAssistantEnabled = form.watch('aiAssistantEnabled')

  const [debouncedOllamaUrl, setDebouncedOllamaUrl] = useDebounceValue(
    form.getValues().serverUrl,
    500,
  )

  const targetOllamaUrl = debouncedOllamaUrl || form.getValues().serverUrl

  // Initialize form with loaded config values
  useEffect(() => {
    if (configStatus !== 'success' || formInitializedRef.current) {
      return
    }

    formReset({
      aiAssistantEnabled:
        aiAssistanceEnabled == null ? true : aiAssistanceEnabled,
      serverUrl: ollamaUrl || 'http://localhost:11434',
      completionModel: completionModel || '',
      improvementModel: improvementModel || '',
    })

    formInitializedRef.current = true
  }, [
    formReset,
    configStatus,
    aiAssistanceEnabled,
    ollamaUrl,
    completionModel,
    improvementModel,
  ])

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isFormDirty)
  }, [isFormDirty, onDirtyChange])

  return {
    form,
    watchAiAssistantEnabled,
    debouncedOllamaUrl,
    setDebouncedOllamaUrl,
    targetOllamaUrl,
    isFormDirty,
  }
}

export interface UseModelValidationProps {
  form: ReturnType<typeof useForm<AssistantSettingsFormValues>>
  models: Array<{ name: string; size: number }> | undefined
  modelsStatus: 'error' | 'success' | 'pending'
  completionModel: string | null
  improvementModel: string | null
  isConnected: boolean | undefined
  connectionStatus: 'error' | 'success' | 'pending'
  connectionLoading: boolean
  configLoading: boolean
}

/**
 * Hook to handle model validation and clearing when connection changes
 */
export function useModelValidation({
  form,
  models,
  modelsStatus,
  completionModel,
  improvementModel,
  isConnected,
  connectionStatus,
  connectionLoading,
  configLoading,
}: UseModelValidationProps) {
  const isFormDirty = form.formState.isDirty

  // Clear model selections when connection is lost
  useEffect(() => {
    if (
      connectionStatus !== 'success' ||
      !isFormDirty ||
      isConnected ||
      connectionLoading ||
      configLoading
    ) {
      return
    }

    form.setValue('completionModel', '')
    form.setValue('improvementModel', '')
  }, [
    form,
    isFormDirty,
    isConnected,
    connectionStatus,
    connectionLoading,
    configLoading,
  ])

  // Validate that selected models still exist in the model list
  useEffect(() => {
    if (modelsStatus !== 'success' || !models || models.length === 0) {
      return
    }

    // Validate completion model
    if (
      completionModel !== '' &&
      completionModel != null &&
      !models.some((model) => model.name === completionModel)
    ) {
      form.setValue('completionModel', '', {
        shouldDirty: true,
        shouldTouch: true,
      })
      form.setError('completionModel', {
        message: 'Completion model is required when AI assistant is enabled',
      })
    }

    // Validate improvement model
    if (
      improvementModel !== '' &&
      improvementModel != null &&
      !models.some((model) => model.name === improvementModel)
    ) {
      form.setValue('improvementModel', '', {
        shouldDirty: true,
        shouldTouch: true,
      })
      form.setError('improvementModel', {
        message: 'Improvement model is required when AI assistant is enabled',
      })
    }
  }, [form, models, modelsStatus, completionModel, improvementModel])
}

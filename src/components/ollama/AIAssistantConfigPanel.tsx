import { ActivityIndicator } from '@/components/ActivityIndicator'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { formatBytesToGB } from '@/lib/formatBytes'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useOllamaModels } from '@/lib/ollama/useOllamaModels'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { CheckCircle2, CircleAlert, Info, RefreshCcw } from 'lucide-react'
import { ReactNode, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import * as z from 'zod'

const RECOMMENDED_MODEL = 'gemma3:latest'

const assistantSettingsFormValues = z
  .object({
    aiAssistantEnabled: z.boolean().optional(),
    serverUrl: z.string().optional(),
    model: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If AI assistant is enabled, validate serverUrl and model
    if (data.aiAssistantEnabled) {
      if (!data.serverUrl || data.serverUrl.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Server URL is required when AI assistant is enabled',
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

      if (!data.model || data.model.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Model is required when AI assistant is enabled',
          path: ['model'],
        })
      }
    }
  })

export type AssistantSettingsFormValues = z.infer<
  typeof assistantSettingsFormValues
>

export interface AIAssistantConfigPanelProps {
  onSubmit: (values: AssistantSettingsFormValues) => void
  onSkip?: () => void
  onDirtyChange?: (dirty: boolean) => void
  disableAnimations?: boolean
  disableSkip?: boolean
  submitLabel?: {
    label: ReactNode
    srLabel?: ReactNode
  }
  skipLabel?: {
    label: ReactNode
    srLabel?: ReactNode
  }
  footerClassName?: string
  placement?: 'onboarding' | 'settings'
}

export function AIAssistantConfigPanel({
  onSubmit,
  onSkip,
  disableAnimations,
  disableSkip,
  onDirtyChange,
  submitLabel = {
    label: 'Finish',
    srLabel: 'Finish onboarding',
  },
  skipLabel = {
    label: 'Skip',
    srLabel: 'Skip onboarding',
  },
  footerClassName,
  placement = 'onboarding',
}: AIAssistantConfigPanelProps) {
  const { ollamaUrl, ollamaModel, configStatus, configLoading } =
    useOllamaConfig()
  const { aiAssistanceEnabled } = useAIConfig()
  const { toast } = useToast()
  const formInitializedRef = useRef(false)

  const form = useForm<z.infer<typeof assistantSettingsFormValues>>({
    resolver: zodResolver(assistantSettingsFormValues),
    defaultValues: {
      aiAssistantEnabled:
        aiAssistanceEnabled == null ? true : aiAssistanceEnabled,
      serverUrl: ollamaUrl || 'http://localhost:11434',
      model: ollamaModel || '',
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

  const {
    data: isConnected,
    status: connectionStatus,
    isLoading: connectionLoading,
    refetch: reconnect,
  } = useOllamaConnection(targetOllamaUrl, configLoading)

  const {
    data: models,
    status: modelsStatus,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useOllamaModels(targetOllamaUrl, configLoading)

  // Initialize useForm lazily
  useEffect(() => {
    if (
      connectionStatus !== 'success' ||
      modelsStatus !== 'success' ||
      configStatus !== 'success' ||
      formInitializedRef.current
    ) {
      return
    }

    formReset({
      aiAssistantEnabled:
        aiAssistanceEnabled == null ? true : aiAssistanceEnabled,
      serverUrl: ollamaUrl || 'http://localhost:11434',
      model: ollamaModel || '',
    })

    formInitializedRef.current = true
  }, [
    formReset,
    connectionStatus,
    modelsStatus,
    configStatus,
    aiAssistanceEnabled,
    ollamaUrl,
    ollamaModel,
  ])

  useEffect(() => {
    if (connectionStatus !== 'success' || !isFormDirty || isConnected) {
      return
    }

    form.setValue('model', '')
  }, [form, isFormDirty, isConnected, connectionStatus])

  useEffect(() => {
    if (
      modelsStatus !== 'success' ||
      ollamaModel === '' ||
      models.some((model) => model.name === ollamaModel)
    ) {
      return
    }

    form.setValue('model', '', { shouldDirty: true, shouldTouch: true })
    form.setError('model', {
      message: 'Model is required when AI assistant is enabled',
    })
  }, [form, models, modelsStatus, ollamaModel])

  useEffect(() => {
    onDirtyChange?.(isFormDirty)
  }, [isFormDirty, onDirtyChange])

  async function handleCopyOllamaPullCommand() {
    await writeText(`ollama pull ${RECOMMENDED_MODEL}`)
    toast.success('Copied to clipboard')
  }

  async function handleReconnect() {
    const { data: isConnected } = await reconnect()

    if (!isConnected) {
      toast.error(`Can't connect to ${targetOllamaUrl}. Is Ollama running?`)
      return
    }

    toast.success('Connection successful')
  }

  async function handleRefreshModels() {
    try {
      await refetchModels()
      toast.success('Models refreshed')
    } catch {
      toast.error('Failed to load models. Check your server URL configuration.')
    }
  }

  function handleSubmit(values: AssistantSettingsFormValues) {
    onSubmit?.(values)
    formReset(values, { keepDirty: false })
  }

  if (configLoading) {
    return null
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-6 items-start w-full"
    >
      <FieldSet className="w-full relative">
        <FieldGroup>
          <div
            className={cn(
              !disableAnimations && 'motion-safe:animate-fade-in delay-150',
            )}
          >
            <Controller
              name="aiAssistantEnabled"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent className="gap-0.5">
                    <FieldLabel
                      htmlFor="form-rhf-switch-ai-assistant"
                      className="text-lg font-semibold"
                    >
                      <span aria-hidden="true">AI Assistant</span>
                      <span className="sr-only">Toggle AI Assistant</span>
                    </FieldLabel>

                    <FieldDescription className="max-w-2xl">
                      When enabled, the AI assistant will provide inline writing
                      suggestions.
                    </FieldDescription>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>

                  <Switch
                    id="form-rhf-switch-ai-assistant"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
          </div>

          {watchAiAssistantEnabled && !isConnected && !connectionLoading && (
            <Alert
              variant="info"
              className={cn(
                'w-full -mt-3',
                !disableAnimations && 'motion-safe:animate-fade-in delay-200',
              )}
            >
              <Info className="size-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription>
                Make sure Ollama is running on your computer to use the AI
                assistant.
              </AlertDescription>
            </Alert>
          )}

          <div
            className={cn(
              !disableAnimations && 'motion-safe:animate-fade-in delay-300',
            )}
          >
            <Controller
              name="serverUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="serverUrl">Server URL</FieldLabel>

                  <div className="flex flex-row gap-2 w-full">
                    <Input
                      {...field}
                      id="serverUrl"
                      className="flex-1"
                      placeholder={`e.g. ${DEFAULT_OLLAMA_URL}`}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      disabled={!watchAiAssistantEnabled}
                      onChange={(ev) => {
                        field.onChange(ev)
                        setDebouncedOllamaUrl(ev.target.value)
                      }}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleReconnect}
                    >
                      <RefreshCcw />
                      <span className="sr-only">Reconnect</span>
                    </Button>
                  </div>

                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription
                      className={cn(
                        'flex flex-row gap-1 items-center',
                        !watchAiAssistantEnabled &&
                          'opacity-80 dark:opacity-50',
                        isConnected ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {connectionLoading && (
                        <ActivityIndicator>
                          Checking connection...
                        </ActivityIndicator>
                      )}

                      {!connectionLoading && isConnected && (
                        <>
                          <CheckCircle2 className="size-4" /> Connected
                        </>
                      )}

                      {!connectionLoading && !isConnected && (
                        <>
                          <CircleAlert className="size-4" /> Can&apos;t connect
                          to {debouncedOllamaUrl}.
                        </>
                      )}
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          </div>

          <div
            className={cn(
              !disableAnimations && 'motion-safe:animate-fade-in delay-500',
            )}
          >
            <Controller
              name="model"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="model">Model</FieldLabel>

                  <div className="flex flex-row gap-2 w-full">
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={
                        !watchAiAssistantEnabled ||
                        !models ||
                        models.length === 0 ||
                        (!isConnected && !connectionLoading)
                      }
                    >
                      <SelectTrigger
                        id="model"
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                      >
                        <SelectValue placeholder="Select a model">
                          {field.value}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(models || []).map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatBytesToGB(model.size)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRefreshModels}
                      disabled={fieldState.invalid || modelsError != null}
                    >
                      <RefreshCcw />
                      <span className="sr-only">Refresh models</span>
                    </Button>
                  </div>

                  {!fieldState.invalid && !modelsError && (
                    <FieldDescription>
                      {modelsLoading && (
                        <ActivityIndicator>Loading models...</ActivityIndicator>
                      )}

                      {!modelsLoading && models && models.length === 0 && (
                        <span className="flex flex-wrap items-center gap-1 text-sm">
                          No models found. Run{' '}
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCopyOllamaPullCommand}
                            size="sm"
                            className="whitespace-normal mx-0 p-0 h-auto rounded-sm text-sm text-foreground/80"
                            aria-label={`Copy "ollama pull ${RECOMMENDED_MODEL}" to clipboard`}
                          >
                            <span className="font-mono cursor-default px-0.5">
                              ollama pull {RECOMMENDED_MODEL}
                            </span>
                          </Button>{' '}
                          in your terminal.
                        </span>
                      )}
                    </FieldDescription>
                  )}

                  {(modelsError || fieldState.invalid) && (
                    <FieldError className="flex flex-row gap-1 items-center">
                      <CircleAlert className="size-4" />
                      {fieldState.error?.message || 'Failed to load models.'}
                    </FieldError>
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <div className={cn('flex flex-row gap-2', footerClassName)}>
        <div
          className={cn(
            !disableAnimations && 'motion-safe:animate-fade-in delay-[600ms]',
          )}
        >
          <Button
            size="sm"
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              (placement === 'settings' && !form.formState.isDirty)
            }
          >
            <span aria-hidden="true">{submitLabel.label}</span>
            <span className="sr-only">
              {submitLabel.srLabel || submitLabel.label}
            </span>
          </Button>
        </div>

        {!disableSkip && (
          <div
            className={cn(
              !disableAnimations && 'motion-safe:animate-fade-in delay-[750ms]',
            )}
          >
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <span aria-hidden="true">{skipLabel.label}</span>
              <span className="sr-only">
                {skipLabel.srLabel || skipLabel.label}
              </span>
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}

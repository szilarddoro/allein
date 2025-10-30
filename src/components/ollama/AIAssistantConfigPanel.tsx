import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useOllamaModels } from '@/lib/ollama/useOllamaModels'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { RefreshCcw } from 'lucide-react'
import { ReactNode } from 'react'
import { AIAssistantToggle } from './AIAssistantToggle'
import { ConnectionStatusAlert } from './ConnectionStatusAlert'
import {
  handleCopyOllamaPullCommand,
  handleReconnect,
  handleRefreshModels,
} from './handlers'
import { ModelSelectorField } from './ModelSelectorField'
import { ServerUrlField } from './ServerUrlField'
import {
  AssistantSettingsFormValues,
  useAIAssistantForm,
  useModelValidation,
} from './useAIAssistantForm'

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

export type { AssistantSettingsFormValues }

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
  const { completionModel, improvementModel, configLoading } = useOllamaConfig()
  const { toast } = useToast()

  const {
    form,
    watchAiAssistantEnabled,
    debouncedOllamaUrl,
    setDebouncedOllamaUrl,
    targetOllamaUrl,
  } = useAIAssistantForm({
    onDirtyChange,
  })

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

  // Handle model validation effects
  useModelValidation({
    form,
    models,
    modelsStatus,
    completionModel,
    improvementModel,
    isConnected,
    connectionStatus,
    connectionLoading,
    configLoading,
  })

  function handleSubmit(values: AssistantSettingsFormValues) {
    onSubmit?.(values)
    form.reset(values, { keepDirty: false })
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-6 items-start w-full"
    >
      <FieldSet className="w-full relative">
        <FieldGroup>
          <AIAssistantToggle
            control={form.control}
            disableAnimations={disableAnimations}
          />

          {watchAiAssistantEnabled &&
            !isConnected &&
            !connectionLoading &&
            !configLoading && (
              <ConnectionStatusAlert disableAnimations={disableAnimations} />
            )}

          <ServerUrlField
            control={form.control}
            disabled={!watchAiAssistantEnabled}
            isConnected={isConnected}
            connectionLoading={connectionLoading}
            configLoading={configLoading}
            debouncedOllamaUrl={debouncedOllamaUrl}
            onReconnect={() =>
              handleReconnect(reconnect, targetOllamaUrl, toast)
            }
            onUrlChange={(value) => setDebouncedOllamaUrl(value)}
            disableAnimations={disableAnimations}
          />

          {/* Models Section Header */}
          <Field
            orientation="horizontal"
            className={cn(
              !disableAnimations && 'motion-safe:animate-fade-in delay-500',
            )}
          >
            <FieldContent>
              <FieldLabel className="text-base">AI Models</FieldLabel>
              <FieldDescription>
                Choose models for specific tasks.
              </FieldDescription>
            </FieldContent>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRefreshModels(refetchModels, toast)}
              disabled={modelsError != null}
            >
              <RefreshCcw />
              <span className="sr-only">Refresh models</span>
            </Button>
          </Field>

          {/* Inline Completion Model */}
          <ModelSelectorField
            control={form.control}
            name="completionModel"
            label="Autocomplete"
            ariaLabel="Model used by the autocomplete feature"
            disabled={
              !watchAiAssistantEnabled ||
              !models ||
              models.length === 0 ||
              (!isConnected && !connectionLoading)
            }
            models={models}
            modelsLoading={modelsLoading}
            modelsError={modelsError}
            onCopyCommand={() => handleCopyOllamaPullCommand(toast)}
            disableAnimations={disableAnimations}
          />

          {/* Text Improvement Model */}
          <ModelSelectorField
            control={form.control}
            name="improvementModel"
            label="Writing Improvements"
            ariaLabel="Model used by the writing improvement feature"
            disabled={
              !watchAiAssistantEnabled ||
              !models ||
              models.length === 0 ||
              (!isConnected && !connectionLoading)
            }
            models={models}
            modelsLoading={modelsLoading}
            modelsError={modelsError}
            onCopyCommand={() => handleCopyOllamaPullCommand(toast)}
            disableAnimations={disableAnimations}
            className="mb-3"
          />
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

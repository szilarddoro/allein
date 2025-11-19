import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Anchor } from '@/components/ui/anchor'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useOllamaModels } from '@/lib/ollama/useOllamaModels'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { AlertCircle, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { AIAssistantToggle } from './AIAssistantToggle'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RECOMMENDED_AUTOCOMPLETION_MODEL,
  RECOMMENDED_WRITING_IMPROVEMENTS_MODEL,
} from '@/lib/constants'
import { ModelDownloadPanel } from '@/components/ollama/ModelDownloadPanel'

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
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false)

  const {
    form,
    watchAiAssistantEnabled,
    debouncedOllamaUrl,
    setDebouncedOllamaUrl,
    targetOllamaUrl,
    isFormDirty,
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

  const isUnableToConnect =
    watchAiAssistantEnabled &&
    !isConnected &&
    !connectionLoading &&
    !configLoading

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
    setAdvancedOptionsOpen(false)
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
            connected={!isUnableToConnect}
          />

          {isUnableToConnect && !isFormDirty && (
            <Alert variant="warning">
              <AlertCircle />

              <AlertDescription>
                Ollama is not running. Please start Ollama or verify the server
                URL in advanced options.
              </AlertDescription>
            </Alert>
          )}

          <Field
            orientation="horizontal"
            className={cn(
              !disableAnimations && 'motion-safe:animate-fade-in delay-500',
            )}
          >
            <FieldContent>
              <FieldLabel className="text-base">AI Models</FieldLabel>
              <FieldDescription>
                For details on downloading additional models, see the{' '}
                <Anchor
                  href="https://docs.ollama.com/cli#download-a-model"
                  className="text-blue-500 !underline-offset-2 dark:text-blue-400"
                >
                  Ollama CLI reference
                </Anchor>
                .
              </FieldDescription>
            </FieldContent>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRefreshModels(refetchModels, toast)}
              disabled={!watchAiAssistantEnabled}
            >
              <RefreshCcw />
              <span className="sr-only">Refresh models</span>
            </Button>
          </Field>

          {!models || models.length === 0 ? (
            <ModelDownloadPanel ollamaUrl={targetOllamaUrl} />
          ) : (
            <>
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
                onCopyCommand={() =>
                  handleCopyOllamaPullCommand(
                    RECOMMENDED_AUTOCOMPLETION_MODEL.name,
                    toast,
                  )
                }
                disableAnimations={disableAnimations}
                recommendedModel={RECOMMENDED_AUTOCOMPLETION_MODEL.name}
              />

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
                onCopyCommand={() =>
                  handleCopyOllamaPullCommand(
                    RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name,
                    toast,
                  )
                }
                disableAnimations={disableAnimations}
                recommendedModel={RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name}
              />
            </>
          )}

          <Collapsible
            id="advanced-options"
            open={advancedOptionsOpen}
            onOpenChange={setAdvancedOptionsOpen}
            className={cn(
              '-mt-3 mb-1',
              !disableAnimations && 'motion-safe:animate-fade-in delay-[650ms]',
            )}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className="text-blue-500 dark:text-blue-400 text-sm hover:underline flex flex-row gap-1 items-center rounded-xs !px-0.5 py-0 h-auto hover:bg-transparent hover:text-blue-500 dark:hover:bg-transparent"
              >
                Advanced Options{' '}
                {advancedOptionsOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent
              className={cn(
                'p-3 rounded-md bg-secondary/40 dark:bg-secondary/40 mt-3 border border-border dark:border-input/50',
                placement === 'onboarding' &&
                  'bg-card/90 dark:bg-input/30 border-input',
              )}
            >
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
                disableAnimations
              />
            </CollapsibleContent>
          </Collapsible>
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
            <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
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

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { cn } from '@/lib/utils'
import { CheckCircle2, CircleAlert, RefreshCcw } from 'lucide-react'
import {
  Controller,
  Control,
  FieldError as ReactHookFormFieldError,
} from 'react-hook-form'
import { AssistantSettingsFormValues } from './useAIAssistantForm'

export interface ServerUrlFieldProps {
  control: Control<AssistantSettingsFormValues>
  disabled: boolean
  isConnected: boolean | undefined
  connectionLoading: boolean
  configLoading: boolean
  debouncedOllamaUrl: string | undefined
  onReconnect: () => void
  onUrlChange: (value: string) => void
  disableAnimations?: boolean
}

export function ServerUrlField({
  control,
  disabled,
  isConnected,
  connectionLoading,
  configLoading,
  debouncedOllamaUrl,
  onReconnect,
  onUrlChange,
  disableAnimations,
}: ServerUrlFieldProps) {
  return (
    <div
      className={cn(
        !disableAnimations && 'motion-safe:animate-fade-in delay-300',
      )}
    >
      <Controller
        name="serverUrl"
        control={control}
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
                disabled={disabled}
                onChange={(ev) => {
                  field.onChange(ev)
                  onUrlChange(ev.target.value)
                }}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onReconnect}
              >
                <RefreshCcw />
                <span className="sr-only">Reconnect</span>
              </Button>
            </div>

            {fieldState.invalid ? (
              <FieldError
                errors={[fieldState.error as ReactHookFormFieldError]}
              />
            ) : (
              <FieldDescription
                className={cn(
                  'flex flex-row gap-1 items-center h-5',
                  disabled && 'opacity-80 dark:opacity-50',
                  isConnected ? 'text-success' : 'text-destructive',
                )}
              >
                {connectionLoading || configLoading ? (
                  <DelayedActivityIndicator delay={500}>
                    Checking connection...
                  </DelayedActivityIndicator>
                ) : !isConnected ? (
                  <>
                    <CircleAlert className="size-4" /> Can&apos;t connect to{' '}
                    {debouncedOllamaUrl}.
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Connected
                  </>
                )}
              </FieldDescription>
            )}
          </Field>
        )}
      />
    </div>
  )
}

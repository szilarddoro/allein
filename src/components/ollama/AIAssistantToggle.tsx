import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Controller,
  Control,
  FieldError as ReactHookFormFieldError,
} from 'react-hook-form'
import { AssistantSettingsFormValues } from './useAIAssistantForm'

export interface AIAssistantToggleProps {
  control: Control<AssistantSettingsFormValues>
  disableAnimations?: boolean
}

export function AIAssistantToggle({
  control,
  disableAnimations,
}: AIAssistantToggleProps) {
  return (
    <div
      className={cn(
        !disableAnimations && 'motion-safe:animate-fade-in delay-150',
      )}
    >
      <Controller
        name="aiAssistantEnabled"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <FieldContent className="gap-0.5">
              <FieldLabel
                htmlFor="form-rhf-switch-ai-assistant"
                className="text-lg font-semibold"
              >
                <span aria-hidden="true">AI Assistant</span>
                <span className="sr-only">Toggle AI Assistant</span>
              </FieldLabel>

              <FieldDescription>
                When enabled, the AI assistant provides inline suggestions and
                helps improve your selected text.
              </FieldDescription>

              {fieldState.invalid && (
                <FieldError
                  errors={[fieldState.error as ReactHookFormFieldError]}
                />
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
  )
}

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { formatBytesToGB } from '@/lib/formatBytes'
import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-react'
import { Controller, Control } from 'react-hook-form'
import { AssistantSettingsFormValues } from './useAIAssistantForm'
import { NoModelsMessage } from './NoModelsMessage'

export interface ModelSelectorFieldProps {
  control: Control<AssistantSettingsFormValues>
  name: 'completionModel' | 'improvementModel'
  label: string
  ariaLabel: string
  disabled: boolean
  models: Array<{ name: string; size: number }> | undefined
  modelsLoading: boolean
  modelsError: Error | null
  onCopyCommand: () => void
  disableAnimations?: boolean
  className?: string
}

export function ModelSelectorField({
  control,
  name,
  label,
  ariaLabel,
  disabled,
  models,
  modelsLoading,
  modelsError,
  onCopyCommand,
  disableAnimations,
  className,
}: ModelSelectorFieldProps) {
  return (
    <div
      className={cn(
        '-mt-3',
        !disableAnimations &&
          name === 'completionModel' &&
          'motion-safe:animate-fade-in delay-550',
        !disableAnimations &&
          name === 'improvementModel' &&
          'motion-safe:animate-fade-in delay-600',
        className,
      )}
    >
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>
              <span aria-hidden="true">{label}</span>
              <span className="sr-only">{ariaLabel}</span>
            </FieldLabel>

            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              disabled={disabled}
            >
              <SelectTrigger
                id={name}
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

            {!fieldState.invalid && !modelsError && (
              <FieldDescription>
                {modelsLoading ? (
                  <DelayedActivityIndicator
                    delay={750}
                    disableMountWhileDelayed
                  >
                    Loading models...
                  </DelayedActivityIndicator>
                ) : models && models.length === 0 ? (
                  <NoModelsMessage onCopyCommand={onCopyCommand} />
                ) : null}
              </FieldDescription>
            )}

            {(fieldState.invalid || modelsError) && (
              <FieldError className="flex flex-row gap-1 items-center">
                <CircleAlert className="size-4" />
                {fieldState.error?.message || 'Failed to load models.'}
              </FieldError>
            )}
          </Field>
        )}
      />
    </div>
  )
}

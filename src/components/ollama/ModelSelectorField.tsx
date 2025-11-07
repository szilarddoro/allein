import * as React from 'react'
import { Check, ChevronsUpDown, CircleAlert } from 'lucide-react'
import { Controller, Control } from 'react-hook-form'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { formatBytesToGB } from '@/lib/formatBytes'
import { cn } from '@/lib/utils'
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
  recommendedModel: string
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
  recommendedModel,
}: ModelSelectorFieldProps) {
  const [open, setOpen] = React.useState(false)

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

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={fieldState.invalid}
                  disabled={disabled}
                  className="w-full justify-between shadow-none hover:bg-muted/50 dark:hover:bg-muted/40"
                  id={name}
                >
                  <span className="truncate">
                    {field.value || 'Select a model...'}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 flex-shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search models..." />
                  <CommandList>
                    <CommandEmpty>No models found.</CommandEmpty>
                    <CommandGroup>
                      {(models || []).map((model) => (
                        <CommandItem
                          key={model.name}
                          value={model.name}
                          onSelect={(currentValue) => {
                            field.onChange(
                              currentValue === field.value ? '' : currentValue,
                            )
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 size-4',
                              field.value === model.name
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatBytesToGB(model.size)}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

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
                  <NoModelsMessage
                    onCopyCommand={onCopyCommand}
                    recommendedModel={recommendedModel}
                  />
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

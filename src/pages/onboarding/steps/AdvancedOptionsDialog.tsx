import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { zodResolver } from '@hookform/resolvers/zod'
import { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

const advancedOptionsSchema = z.object({
  serverUrl: z
    .string()
    .min(1, 'This field is required')
    .refine(
      (url) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      { message: `Please enter a valid URL (e.g., ${DEFAULT_OLLAMA_URL})` },
    ),
})

type AdvancedOptionsFormValues = z.infer<typeof advancedOptionsSchema>

export interface AdvancedOptionsDialogProps {
  triggerButton?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (serverUrl: string) => void
  defaultUrl: string
}

export function AdvancedOptionsDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultUrl,
  triggerButton,
}: AdvancedOptionsDialogProps) {
  const { control, handleSubmit, reset } = useForm<AdvancedOptionsFormValues>({
    resolver: zodResolver(advancedOptionsSchema),
    defaultValues: {
      serverUrl: defaultUrl,
    },
  })

  const handleSubmitForm = (data: AdvancedOptionsFormValues) => {
    onSubmit(data.serverUrl)
    reset()
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Advanced Options</DialogTitle>
          <DialogDescription className="sr-only">
            Change the default server configuration
          </DialogDescription>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <Controller
            name="serverUrl"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ollama-url">Custom Ollama URL</FieldLabel>
                <Input
                  {...field}
                  id="ollama-url"
                  placeholder={`e.g. ${DEFAULT_OLLAMA_URL}`}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  autoFocus
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Change the URL if Ollama is on a different host or port.
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <DialogFooter className="mt-6">
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

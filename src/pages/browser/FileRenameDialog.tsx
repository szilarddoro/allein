import { useState, useEffect, useRef, FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { getDisplayName } from '@/lib/files/fileUtils'

export interface FileRenameDialogProps {
  isOpen: boolean
  fileName: string | null
  error: Error | null
  onSubmit: (newName: string) => void
  onCancel: () => void
}

export function FileRenameDialog({
  isOpen,
  fileName,
  error,
  onSubmit,
  onCancel,
}: FileRenameDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && fileName) {
      const displayName = getDisplayName(fileName)
      setInputValue(displayName)
      // Focus and select the input after a brief delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isOpen, fileName])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(inputValue)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
  }

  if (!fileName) {
    return null
  }

  const displayName = getDisplayName(fileName)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Enter a new name for &quot;{displayName}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field data-invalid={error != null}>
            <FieldLabel htmlFor="file-name">
              File name
              <span className="sr-only"> (required)</span>
            </FieldLabel>

            <Input
              id="file-name"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter file name"
              aria-invalid={error != null}
              aria-describedby={error ? 'file-name-error' : undefined}
              disabled={!isOpen}
              className="text-sm"
            />

            {!error && (
              <FieldDescription>
                The .md extension will be added automatically
              </FieldDescription>
            )}

            {error && (
              <FieldError id="file-name-error">{error.message}</FieldError>
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!inputValue.trim()}>
              Rename
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

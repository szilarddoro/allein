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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { getDisplayName } from '@/lib/files/fileUtils'

export interface ItemRenameDialogProps {
  isOpen: boolean
  itemName: string | null
  itemType: 'file' | 'folder'
  error: Error | null
  onSubmit: (newName: string) => void
  onCancel: () => void
}

export function ItemRenameDialog({
  isOpen,
  itemName,
  itemType,
  error,
  onSubmit,
  onCancel,
}: ItemRenameDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && itemName) {
      const displayName =
        itemType === 'file' ? getDisplayName(itemName) : itemName
      setInputValue(displayName)
      // Focus and select the input after a brief delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isOpen, itemName, itemType])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(inputValue)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
  }

  if (!itemName) {
    return null
  }

  const displayName = itemType === 'file' ? getDisplayName(itemName) : itemName
  const itemTypeCapitalized = itemType === 'file' ? 'File' : 'Folder'
  const itemLabel = itemType === 'file' ? 'File name' : 'Folder name'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename {itemTypeCapitalized}</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a new name for &quot;{displayName}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field data-invalid={error != null}>
            <FieldLabel htmlFor="item-name">
              {itemLabel}
              <span className="sr-only"> (required)</span>
            </FieldLabel>

            <Input
              id="item-name"
              ref={inputRef}
              value={inputValue}
              placeholder={displayName}
              onChange={(e) => setInputValue(e.target.value)}
              aria-invalid={error != null}
              aria-describedby={error ? 'item-name-error' : undefined}
              disabled={!isOpen}
              className="text-sm"
            />

            {error && (
              <FieldError id="item-name-error">{error.message}</FieldError>
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

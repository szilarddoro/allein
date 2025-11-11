import { AlertText } from '@/components/AlertText'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'

export interface ItemRenameInputProps {
  itemName: string
  onSubmit: (value: string) => void
  onCancel: () => void
  error?: Error | null
  editing?: boolean
}

export function ItemRenameInput({
  itemName,
  onSubmit,
  onCancel,
  error,
  editing,
}: ItemRenameInputProps) {
  const [value, setValue] = useState(itemName)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.select()
  }, [])

  useEffect(() => {
    if (error != null || editing) {
      ref.current?.focus()
      ref.current?.select()
    }
  }, [error, editing])

  function handleBlur() {
    onSubmit(value)
  }

  function handleChange(ev: ChangeEvent<HTMLInputElement>) {
    setValue(ev.target.value)
  }

  function handleKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter') {
      ev.stopPropagation()
      onSubmit(value)
    }

    if (ev.key === 'Escape') {
      ev.stopPropagation()
      onCancel()
    }
  }

  return (
    <div className="relative w-full">
      <Popover open={error != null}>
        <PopoverAnchor className="w-full">
          <Input
            id="item-name"
            autoFocus
            placeholder={itemName}
            defaultValue={itemName}
            aria-invalid={error != null}
            aria-label="Edit file name"
            aria-describedby="item-name-error"
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-8 p-2 ring-0 focus:ring-0 focus-visible:ring-0 border-2 !border-blue-500 bg-secondary font-medium cursor-text"
            ref={ref}
          />
        </PopoverAnchor>
        <PopoverContent
          className="p-0 border-0 shadow-sm"
          align="start"
          side="bottom"
        >
          {error != null && (
            <AlertText className="w-full" id="item-name-error">
              {error.message}
            </AlertText>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

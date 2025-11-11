import { Input } from '@/components/ui/input'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ItemRenameInputProps {
  itemName: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function ItemRenameInput({
  itemName,
  onSubmit,
  onCancel,
}: ItemRenameInputProps) {
  const [value, setValue] = useState(itemName)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.select()
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(value)
  }, [onSubmit, value])

  return (
    <Input
      autoFocus
      placeholder={itemName}
      defaultValue={itemName}
      aria-label={`Rename ${itemName}`}
      onChange={(ev) => setValue(ev.target.value)}
      onBlur={handleSubmit}
      className="h-8 p-2 ring-0 focus:ring-0 focus-visible:ring-0 border-2 !border-blue-500 bg-secondary font-medium"
      onKeyDown={(ev) => {
        if (ev.key === 'Enter') {
          ev.stopPropagation()
          handleSubmit()
        }

        if (ev.key === 'Escape') {
          ev.stopPropagation()
          onCancel()
        }
      }}
      ref={ref}
    />
  )
}

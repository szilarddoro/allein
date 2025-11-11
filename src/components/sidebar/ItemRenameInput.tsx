import { AlertText } from '@/components/AlertText'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ChangeEvent,
  KeyboardEvent,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useOnClickOutside } from 'usehooks-ts'

export interface ItemRenameInputProps {
  itemName: string
  onSubmit: (value: string) => void
  onCancel: () => void
  error?: Error | null
  editing?: boolean
  className?: string
}

export function ItemRenameInput({
  itemName,
  onSubmit,
  onCancel,
  error,
  editing,
  className,
}: ItemRenameInputProps) {
  const valueAtPreviousSubmitRef = useRef<string>(null)
  const [value, setValue] = useState(itemName)
  const ref = useRef<HTMLInputElement>(null)

  // Treat outside click while a warning is visible as a cancel operation
  useOnClickOutside(ref as RefObject<HTMLInputElement>, () => {
    if (!editing) {
      return
    }

    if (error != null && valueAtPreviousSubmitRef.current === value) {
      setValue(itemName)
      onCancel()
    }
  })

  useEffect(() => {
    if (error != null) {
      ref.current?.focus()
      ref.current?.select()
    }
  }, [error])

  useEffect(() => {
    if (editing) {
      ref.current?.focus()
      ref.current?.select()
    }
  }, [editing])

  function handleBlur() {
    onSubmit(value)
    valueAtPreviousSubmitRef.current = value
  }

  function handleChange(ev: ChangeEvent<HTMLInputElement>) {
    setValue(ev.target.value)
  }

  function handleKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter') {
      ev.preventDefault()
      ev.stopPropagation()
      ref.current?.blur()
    }

    if (ev.key === 'Escape') {
      ev.stopPropagation()
      setValue(itemName)
      onCancel()
    }
  }

  return (
    <div
      className={cn('relative w-full', className)}
      onClick={(ev) => ev.stopPropagation()}
    >
      <Popover open={error != null}>
        <PopoverAnchor className="w-full">
          <Input
            disabled={!editing}
            id="item-name"
            autoFocus
            placeholder={itemName}
            value={value}
            aria-invalid={error != null}
            aria-label="Edit file name"
            aria-describedby="item-name-error"
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-8 p-2 text-sm border-none !ring-2 !ring-blue-500 bg-neutral-200/70 dark:bg-neutral-900/70 selection:bg-blue-300 dark:selection:bg-blue-500 font-medium cursor-text"
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

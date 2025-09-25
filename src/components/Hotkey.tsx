import { cn } from '@/lib/utils'

type Modifier = 'ctrl' | 'shift' | 'alt' | 'meta'

export interface HotkeyProps {
  className?: string
  modifiers?: [] | [Modifier] | [Modifier, Modifier]
  keyCode: string
}

const cmdRegex = /Mac|iPod|iPhone|iPad/i

function isCmdAvailable() {
  return cmdRegex.test(navigator.userAgent)
}

export function Hotkey({ modifiers = [], keyCode, className }: HotkeyProps) {
  const keyMap = {
    ctrl: '^',
    shift: '⇧',
    alt: '⌥',
    meta: isCmdAvailable() ? '⌘' : '^',
  }

  const normalizedModifiers = Array.from(new Set(modifiers)).map(
    (modifier) => keyMap[modifier],
  )

  return (
    <code
      className={cn(
        'bg-transparent font-sans align-baseline border-none text-xs/tight opacity-60 py-0 px-0.5',
        className,
      )}
    >
      {normalizedModifiers.map((modifier) => (
        <span key={modifier}>{modifier}</span>
      ))}
      <span>{keyCode.toUpperCase()}</span>
      <span className="sr-only">Hotkey</span>
    </code>
  )
}

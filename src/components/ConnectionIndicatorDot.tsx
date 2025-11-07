import { cn } from '@/lib/utils'

export interface ConnectionIndicatorDotProps {
  disabled?: boolean
  connected?: boolean
}

export function ConnectionIndicatorDot({
  disabled,
  connected,
}: ConnectionIndicatorDotProps) {
  return (
    <div
      className={cn(
        'relative motion-safe:transition-all',
        disabled && 'opacity-70 grayscale',
      )}
    >
      <span className="sr-only">
        {connected ? 'Connected' : 'Not Connected'}
      </span>

      <div
        className={cn(
          'size-2 rounded-full relative top-0 left-0 z-10',
          connected ? 'bg-green-500' : 'bg-red-500',
        )}
      />

      {connected && (
        <div
          className={cn(
            'size-2 rounded-full absolute top-0 left-0 bg-green-400 dark:bg-green-600',
            !disabled && 'motion-safe:animate-ping',
          )}
        />
      )}
    </div>
  )
}

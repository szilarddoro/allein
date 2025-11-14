import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { openUrl } from '@tauri-apps/plugin-opener'
import { DetailedHTMLProps, HTMLProps, MouseEvent } from 'react'

export function Anchor({
  className,
  ...props
}: DetailedHTMLProps<HTMLProps<HTMLAnchorElement>, HTMLAnchorElement>) {
  const { toast } = useToast()

  async function handleClick(ev: MouseEvent<HTMLAnchorElement>) {
    ev.preventDefault()

    if (props.href == null) {
      return
    }

    try {
      await openUrl(props.href)
    } catch {
      toast.error('Failed to open URL. Please try again.')
    }

    props.onClick?.(ev)
  }

  return (
    <a
      draggable={false}
      {...props}
      onClick={handleClick}
      className={cn(
        'rounded-md focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    />
  )
}

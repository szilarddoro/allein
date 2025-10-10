import { cn } from '@/lib/utils'
import React, { forwardRef } from 'react'
import { Link as RouterLink, LinkProps, useNavigate } from 'react-router'

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const navigate = useNavigate()
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent CMD/CTRL/Shift+Click from reloading the page
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      e.preventDefault()
      navigate(props.to)
      return
    }

    // Call user's onClick if provided
    props.onClick?.(e)
  }

  return (
    <RouterLink
      draggable={false}
      {...props}
      className={cn(
        'rounded-md focus:ring-[3px] focus:border-ring focus:ring-ring/50 focus:outline-none',
        props.className,
      )}
      ref={ref}
      onClick={handleClick}
    />
  )
})

Link.displayName = 'Link'

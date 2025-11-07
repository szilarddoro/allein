import { AboutDetails } from '@/components/settings/AboutDetails'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInvalidateQueriesOnWindowFocus } from '@/lib/useInvalidateQueriesOnWindowFocus'
import { useMenuBar } from '@/lib/useMenuBar'
import { cn } from '@/lib/utils'
import { PropsWithChildren, useState } from 'react'

export interface BaseLayoutProps extends PropsWithChildren {
  className?: string
}

export function BaseLayout({ className, children }: BaseLayoutProps) {
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  useInvalidateQueriesOnWindowFocus()
  useMenuBar({ onOpenAbout: setAboutDialogOpen })

  return (
    <>
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>About Allein</DialogTitle>
            <DialogDescription className="sr-only">
              Learn more about the app version and the license.
            </DialogDescription>
          </DialogHeader>

          <div>
            <AboutDetails />
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          'relative h-screen flex flex-col bg-gradient-to-br bg-zinc-100 dark:bg-zinc-900 overflow-hidden',
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}

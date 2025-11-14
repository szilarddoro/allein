import { AboutDetails } from '@/components/settings/AboutDetails'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LocationHistoryProvider } from '@/lib/locationHistory/LocationHistoryProvider'
import { useInvalidateQueriesOnWindowFocus } from '@/lib/useInvalidateQueriesOnWindowFocus'
import { useMenuBar } from '@/lib/useMenuBar'
import { cn } from '@/lib/utils'
import { PropsWithChildren, useState } from 'react'

export interface BaseLayoutContentProps extends PropsWithChildren {
  className?: string
  onOpenAbout: () => void
}

function BaseLayoutContent({
  children,
  className,
  onOpenAbout,
}: BaseLayoutContentProps) {
  // `useMenuBar` needs to have access to the LocationHistoryContext to be able to reset the history
  useMenuBar({ onOpenAbout })

  return (
    <div
      className={cn(
        'relative h-screen flex flex-col bg-gradient-to-br bg-neutral-100 dark:bg-neutral-900 overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function BaseLayout({ children }: PropsWithChildren) {
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  useInvalidateQueriesOnWindowFocus()

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

      <LocationHistoryProvider>
        <BaseLayoutContent onOpenAbout={() => setAboutDialogOpen(true)}>
          {children}
        </BaseLayoutContent>
      </LocationHistoryProvider>
    </>
  )
}

import { H1 } from '@/components/ui/typography'
import { SendFeedbackButton } from '@/lib/report/SendFeedbackButton'
import { AppLayoutContextProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getAppLicense, getAppVersion } from '@/lib/version'
import { useOutletContext } from 'react-router'
import { AIAssistantCard } from './AIAssistantCard'
import { AppearanceCard } from './AppearanceCard'
import { DebugCard } from './DebugCard'
import { LogsCard } from './LogsCard'
import { CheckForUpdatesButton } from '@/lib/updater/CheckForUpdatesButton'

export function SettingsPage() {
  const { sidebarOpen } = useOutletContext<AppLayoutContextProps>()

  return (
    <div>
      <div
        className={cn(
          'pt-4 pb-4 flex-1 grow shrink-0 mx-auto w-full flex flex-col gap-4',
          !sidebarOpen && 'pl-4',
        )}
      >
        <H1 className="my-0 text-2xl pl-1">Preferences</H1>

        <section>
          <AIAssistantCard />
        </section>

        <section>
          <AppearanceCard />
        </section>

        <section>
          <LogsCard />
        </section>

        {import.meta.env.DEV && (
          <section>
            <DebugCard />
          </section>
        )}
      </div>

      <footer className="flex flex-col gap-3 justify-center items-center pt-4 pb-16 px-4 text-center text-xs">
        <div className="flex flex-col gap-1">
          <SendFeedbackButton />
          <CheckForUpdatesButton />
        </div>

        <p className="text-muted-foreground/80">
          Version: {getAppVersion()} - License: {getAppLicense()}
        </p>
      </footer>
    </div>
  )
}

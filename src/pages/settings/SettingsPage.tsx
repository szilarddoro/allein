import { H1 } from '@/components/ui/typography'
import { DebugCard } from './DebugCard'
import { AIAssistantCard } from './AIAssistantCard'
import { AppearanceCard } from './AppearanceCard'
import { LogsCard } from './LogsCard'
import { UpdatesCard } from './UpdatesCard'
import { useOutletContext } from 'react-router'
import { AppLayoutContextProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getAppVersion, getAppLicense } from '@/lib/version'
import { SendFeedbackButton } from '@/lib/report/SendFeedbackButton'

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
          <UpdatesCard />
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

      <footer className="flex flex-col gap-3 justify-center items-center pt-4 pb-16 px-4 text-center text-muted-foreground/80 text-xs">
        <SendFeedbackButton />

        <p>
          Version: {getAppVersion()} - License: {getAppLicense()}
        </p>
      </footer>
    </div>
  )
}

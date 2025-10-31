import { H1 } from '@/components/ui/typography'
import { DebugCard } from './DebugCard'
import { AboutCard } from './AboutCard'
import { AIAssistantCard } from './AIAssistantCard'
import { AppearanceCard } from './AppearanceCard'
import { useOutletContext } from 'react-router'
import { AppLayoutContextProps } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { sidebarOpen } = useOutletContext<AppLayoutContextProps>()

  return (
    <div
      className={cn(
        'pt-4 pr-4 pb-32 flex-1 max-w-7xl 3xl:max-w-3/5 mx-auto w-full flex flex-col gap-6 pl-1',
        !sidebarOpen && 'pl-4',
      )}
    >
      <H1 className="my-0 text-3xl">Settings</H1>

      <section>
        <AIAssistantCard />
      </section>

      <section>
        <AppearanceCard />
      </section>

      {import.meta.env.DEV && (
        <section>
          <DebugCard />
        </section>
      )}

      <section>
        <AboutCard />
      </section>
    </div>
  )
}

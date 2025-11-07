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
        'pt-4 pb-32 flex-1 mx-auto w-full flex flex-col gap-4',
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
        <AboutCard />
      </section>

      {import.meta.env.DEV && (
        <section>
          <DebugCard />
        </section>
      )}
    </div>
  )
}

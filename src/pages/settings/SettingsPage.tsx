import { H1 } from '@/components/ui/typography'
import { AIAssistantCard } from './AIAssistantCard'
import { AppearanceCard } from './AppearanceCard'
import { AboutCard } from './AboutCard'
import { DebugCard } from '@/pages/settings/DebugCard'

export function SettingsPage() {
  return (
    <div className="pt-4 pl-6 pr-4 pb-32 flex-1 max-w-7xl mx-auto w-full flex flex-col gap-6">
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

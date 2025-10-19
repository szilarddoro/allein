import { H1 } from '@/components/ui/typography'
import { AIAssistantCard } from './AIAssistantCard'
import { AppearanceCard } from './AppearanceCard'
import { AboutCard } from './AboutCard'
import { DebugCard } from '@/pages/settings/DebugCard'

export function SettingsPage() {
  return (
    <div className="p-6 pt-4 pb-32 flex-1 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <H1>Settings</H1>

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
    </div>
  )
}

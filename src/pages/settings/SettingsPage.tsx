import { H1 } from '@/components/ui/typography'
import { AIAssistantCard } from './AIAssistantCard'
import { AppearanceCard } from './AppearanceCard'
import { AboutCard } from './AboutCard'
import { DebugCard } from '@/pages/settings/DebugCard'
import { Link } from '@/components/ui/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
  return (
    <div className="pt-4 pl-6 pr-4 pb-32 flex-1 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        className="self-start !px-1.5 py-1 h-auto"
        size="sm"
      >
        <Link
          to="/"
          className="flex flex-row gap-1 items-center text-sm cursor-default text-muted-foreground"
          onContextMenu={(ev) => ev.preventDefault()}
        >
          <ArrowLeft className="size-4" /> Go to the Browser
        </Link>
      </Button>

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

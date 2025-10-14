import alleinLogo from '@/assets/allein-logo.png'
import { Button } from '@/components/ui/button'
import { H1, H2, P } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import { PropsWithChildren } from 'react'

export function FeatureListItem({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <li
      className={cn(
        'flex flex-row gap-1.5 items-center justify-start sm:justify-center motion-safe:animate-fade-in',
        className,
      )}
    >
      <CheckCircle2 className="w-4 h-4" /> {children}
    </li>
  )
}

interface WelcomeStepProps {
  onNext: () => void
  onSkip: () => void
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="relative max-w-4xl w-full mx-auto flex flex-col gap-6 items-center justify-center flex-1 select-none pt-4 pb-16 px-4">
      <H1 className="sr-only">Start Onboarding</H1>
      <div className="flex flex-col items-center justify-center motion-safe:animate-fade-in">
        <img
          draggable={false}
          src={alleinLogo}
          width={1024}
          height={1024}
          alt="Letter A in a rounded rectangle"
          className="w-20 h-20 mb-2"
        />

        <H2 className="my-0 text-3xl font-bold mb-1 text-center">
          Welcome to Allein
        </H2>

        <P className="my-0 text-muted-foreground text-center">
          An intuitive note-taking app featuring built-in AI assistance.
        </P>
      </div>

      <ul className="flex flex-col gap-2">
        <FeatureListItem className="delay-[150ms]">
          Predictive inline suggestions
        </FeatureListItem>
        <FeatureListItem className="delay-[350ms]">
          Quick and easy text improvements
        </FeatureListItem>
        <FeatureListItem className="delay-[550ms]">
          Files stored locally, works offline
        </FeatureListItem>
        <FeatureListItem className="delay-[750ms]">
          No user account is required
        </FeatureListItem>
      </ul>

      <div className="flex flex-col gap-2 mt-2">
        <Button
          size="sm"
          className="motion-safe:animate-[fade-in_0.5s_ease-in-out_1.25s_1_normal_backwards]"
          onClick={onNext}
        >
          <span aria-hidden="true">Get Started</span>
          <span className="sr-only">Start onboarding process</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="motion-safe:animate-[fade-in_0.5s_ease-in-out_1.45s_1_normal_backwards] self-center"
          onClick={onSkip}
        >
          <span aria-hidden="true">Skip</span>
          <span className="sr-only">Skip onboarding</span>
        </Button>
      </div>
    </div>
  )
}

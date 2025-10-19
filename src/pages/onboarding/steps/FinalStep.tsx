import alleinLogo from '@/assets/allein-logo.png'
import { Button } from '@/components/ui/button'
import { H1, P } from '@/components/ui/typography'

export interface FinalStepProps {
  onNext?: () => void
}

export function FinalStep({ onNext }: FinalStepProps) {
  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 justify-center items-center flex-1 select-none pt-4 pb-16 px-4">
      <div className="flex flex-col items-center justify-center motion-safe:animate-fade-in">
        <img
          draggable={false}
          src={alleinLogo}
          width={1024}
          height={1024}
          alt="Letter A in a rounded rectangle"
          className="size-20 mb-2"
        />

        <H1 className="my-0 text-3xl font-bold mb-1 text-center flex flex-row gap-2 items-center">
          Setup Complete
        </H1>

        <P className="my-0 text-muted-foreground text-center max-w-md">
          The app is ready. Start writing and stay organized effortlessly.
        </P>
      </div>

      <div className="motion-safe:animate-fade-in delay-200">
        <Button onClick={onNext} size="sm">
          Start writing
        </Button>
      </div>
    </div>
  )
}

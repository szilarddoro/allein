import alleinLogo from '@/assets/allein-logo.png'
import { Button } from '@/components/ui/button'
import { H1, P } from '@/components/ui/typography'

export interface FinalStepProps {
  onNext?: () => void
}

export function FinalStep({ onNext }: FinalStepProps) {
  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 justify-center items-center flex-1 pt-4 pb-16 px-4">
      <div className="flex flex-col items-center justify-center motion-safe:animate-fade-in">
        <img
          draggable={false}
          src={alleinLogo}
          width={1024}
          height={1024}
          alt="Letter A in a rounded rectangle"
          className="size-20 mb-2"
        />

        <H1 className="my-0 text-3xl text-center">You&apos;re all set!</H1>

        <P className="mt-1 mb-0 text-foreground/70 text-center max-w-md">
          Start writing and stay organized.
        </P>
      </div>

      <div className="motion-safe:animate-fade-in delay-200">
        <Button onClick={onNext} size="sm">
          Begin
        </Button>
      </div>
    </div>
  )
}

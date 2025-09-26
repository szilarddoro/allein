import { H1, H2, P } from '@/components/ui/typography'

export function BrowserPage() {
  return (
    <div className="flex-1 overflow-hidden flex justify-center items-center select-none">
      <div className="flex flex-col gap-2 max-w-lg mx-auto w-full text-center -mt-12">
        <H1 className="sr-only">Home</H1>
        <H2>Welcome to Allein</H2>
        <P className="text-muted-foreground">
          Allein is a modern note-taking app that allows you to take notes,
          create documents, and more.
        </P>
      </div>
    </div>
  )
}

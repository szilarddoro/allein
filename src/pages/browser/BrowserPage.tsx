import { H1, P } from '@/components/ui/typography'

export function BrowserPage() {
  return (
    <div className="flex-1 overflow-hidden flex justify-center items-center select-none">
      <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full text-center -mt-12">
        <H1 className="text-3xl/tight mb-0">Welcome to Allein</H1>
        <P className="text-muted-foreground my-0 leading-normal">
          Allein is a modern note-taking app that allows you to take notes,
          create documents, and more.
        </P>
      </div>
    </div>
  )
}

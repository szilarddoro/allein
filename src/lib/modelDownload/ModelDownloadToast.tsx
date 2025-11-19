import { Toast } from '@/components/Toast'
import { Progress } from '@/components/ui/progress'
import { H3 } from '@/components/ui/typography'
import { useModelDownloadContext } from '@/lib/modelDownload/useModelDownloadContext'

export function ModelDownloadToast() {
  const { autocompletionModel, writingImprovementsModel } =
    useModelDownloadContext()

  return (
    <Toast
      visible
      className="pl-[unset] pr-[unset] px-3! flex flex-col gap-2 w-full"
    >
      <H3 className="text-sm self-start my-0 text-muted-foreground sr-only">
        Model Download Status
      </H3>

      <div className="grid grid-cols-2 items-center w-full">
        <span className="whitespace-nowrap">Autocompletion</span>

        <span className="shrink-0 grow">
          <Progress value={autocompletionModel.modelProgress} max={100} />
        </span>
      </div>

      <div className="grid grid-cols-2 items-center w-full">
        <span className="whitespace-nowrap">Writing Improvements</span>

        <span className="shrink-0 grow">
          <Progress value={writingImprovementsModel.modelProgress} max={100} />
        </span>
      </div>
    </Toast>
  )
}

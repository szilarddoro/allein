import { Toast } from '@/components/Toast'
import { Separator } from '@/components/ui/separator'
import { H3 } from '@/components/ui/typography'
import { useModelDownloadContext } from '@/lib/modelDownload/useModelDownloadContext'
import { ModelProgress } from '@/lib/updater/ModelProgress'
import { useEffect, useState } from 'react'

export function ModelDownloadToast() {
  const { autocompletionModel, writingImprovementsModel } =
    useModelDownloadContext()
  const [visible, setVisible] = useState(false)

  const anyPending =
    autocompletionModel.modelStatus === 'pending' ||
    writingImprovementsModel.modelStatus === 'pending'

  const bothSucceeded =
    autocompletionModel.modelStatus === 'success' &&
    writingImprovementsModel.modelStatus === 'success'

  useEffect(() => {
    if (!anyPending || visible) {
      return
    }

    setVisible(true)
  }, [anyPending, visible])

  useEffect(() => {
    if (!bothSucceeded || !visible) {
      return
    }

    setVisible(false)
  }, [bothSucceeded, visible])

  return (
    <Toast
      visible={visible}
      className="pl-[unset] pr-[unset] px-3! flex flex-col gap-2 w-full"
    >
      <H3 className="text-sm self-start my-0 text-muted-foreground font-normal sr-only">
        Downloading AI models
      </H3>

      <ModelProgress
        name="Autocompletion"
        status={autocompletionModel.modelStatus}
        progress={autocompletionModel.modelProgress}
        error={autocompletionModel.modelError}
      />

      <Separator />

      <ModelProgress
        name="Writing Improvements"
        status={writingImprovementsModel.modelStatus}
        progress={writingImprovementsModel.modelProgress}
        error={writingImprovementsModel.modelError}
      />
    </Toast>
  )
}

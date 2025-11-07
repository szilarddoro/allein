import alleinLogo from '@/assets/allein-logo.png'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { H1, P } from '@/components/ui/typography'
import {
  RECOMMENDED_AUTOCOMPLETION_MODEL,
  RECOMMENDED_WRITING_IMPROVEMENTS_MODEL,
} from '@/lib/constants'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { ModelCardWithProgress } from '@/pages/onboarding/steps/ModelCardWithProgress'
import { usePullModelWithStatus } from '@/pages/onboarding/steps/usePullModelWithStatus'
import { AdvancedOptionsDialog } from '@/pages/onboarding/steps/AdvancedOptionsDialog'
import { AlertCircle, Sparkles, Zap } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import suggestionsPreviewLight from '@/assets/previews/context-aware-autocompletion-light.png'
import suggestionsPreviewDark from '@/assets/previews/context-aware-autocompletion-dark.png'
import improvementsPreviewLight from '@/assets/previews/writing-improvements-light.png'
import improvementsPreviewDark from '@/assets/previews/writing-improvements-dark.png'

export interface DownloadModelsSubmitData {
  completionModel: string
  improvementModel: string
  serverUrl: string
}

export interface DownloadModelsStepProps {
  onNext: (data: DownloadModelsSubmitData) => void
}

export function DownloadModelsStep({ onNext }: DownloadModelsStepProps) {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL)
  const { data: isConnected, status: connectionStatus } =
    useOllamaConnection(ollamaUrl)

  const [downloadEnabled, setDownloadEnabled] = useState(false)

  // Note: We consider these both scenarios valid only if the connection check has succeeded
  const isOllamaConnected = connectionStatus === 'success' && isConnected
  const isOllamaDisconnected = connectionStatus === 'success' && !isConnected

  const {
    modelStatus: autocompletionModelStatus,
    modelProgress: autocompletionModelProgress,
    modelError: autocompletionModelError,
  } = usePullModelWithStatus({
    disabled: !downloadEnabled || isOllamaDisconnected,
    model: RECOMMENDED_AUTOCOMPLETION_MODEL.name,
    connected: isOllamaConnected,
  })

  const {
    modelStatus: writingImprovementsModelStatus,
    modelProgress: writingImprovementsModelProgress,
    modelError: writingImprovementsModelError,
  } = usePullModelWithStatus({
    disabled: !downloadEnabled || isOllamaDisconnected,
    model: RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name,
    connected: isOllamaConnected,
  })

  const isDownloading =
    autocompletionModelStatus === 'pending' ||
    writingImprovementsModelStatus === 'pending'

  const isDownloadComplete =
    autocompletionModelStatus === 'success' &&
    writingImprovementsModelStatus === 'success'

  function handleDownload() {
    setDownloadEnabled(true)
  }

  function handleSubmit() {
    onNext({
      completionModel: RECOMMENDED_AUTOCOMPLETION_MODEL.name,
      improvementModel: RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name,
      serverUrl: ollamaUrl,
    })
  }

  function handleAdvancedOptionsSubmit(serverUrl: string) {
    setOllamaUrl(serverUrl)
  }

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 justify-center items-center flex-1 pt-4 pb-16 px-4">
      <div className="flex flex-col items-center justify-center motion-safe:animate-fade-in">
        <img
          draggable={false}
          src={alleinLogo}
          width={1024}
          height={1024}
          alt="Letter A in a rounded rectangle"
          className="size-16 mb-2"
        />

        <H1 className="my-0 text-3xl text-center">Setup AI Models</H1>
        <P className="text-foreground/70 mt-1">
          Writing assistance that stays on your device.
        </P>
      </div>

      {isOllamaDisconnected && (
        <Alert className="max-w-4xl" variant="warning">
          <AlertCircle />
          <AlertDescription>
            <span>
              Ollama is not available on {ollamaUrl}. Please start Ollama or
              verify the server URL in{' '}
              <button
                className="rounded-md underline inline cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                onClick={() => setShowAdvancedOptions(true)}
              >
                advanced options
              </button>
              .
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-6 w-full max-w-[60rem]">
        <ModelCardWithProgress
          previewImageSrc={
            currentTheme === 'dark'
              ? suggestionsPreviewDark
              : suggestionsPreviewLight
          }
          previewImageAlt="A desktop application showcasing inline suggestions"
          icon={<Zap className="size-4" />}
          title="Context-Aware Autocompletion"
          description="Get contextual writing suggestions in real-time—as you type."
          modelName={RECOMMENDED_AUTOCOMPLETION_MODEL.name}
          modelUrl={RECOMMENDED_AUTOCOMPLETION_MODEL.url}
          status={autocompletionModelStatus}
          progress={autocompletionModelProgress}
          error={autocompletionModelError}
          className="motion-safe:animate-fade-in delay-300"
        />

        <ModelCardWithProgress
          previewImageSrc={
            currentTheme === 'dark'
              ? improvementsPreviewDark
              : improvementsPreviewLight
          }
          previewImageAlt="A desktop application showcasing writing improvements"
          icon={<Sparkles className="size-4" />}
          title="Writing Improvements"
          description="Refine your writing with intelligent grammar and style feedback."
          modelName={RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name}
          modelUrl={RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.url}
          status={writingImprovementsModelStatus}
          progress={writingImprovementsModelProgress}
          error={writingImprovementsModelError}
          className="motion-safe:animate-fade-in delay-500"
        />
      </div>

      <div className="motion-safe:animate-fade-in delay-700">
        {isDownloadComplete ? (
          <div className="flex flex-col gap-2.5 items-center">
            <P className="my-2 text-sm text-muted-foreground">
              Pro tip: Adjust these settings anytime in preferences.
            </P>

            <Button size="sm" onClick={handleSubmit}>
              Complete Setup
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 items-center max-w-lg w-full">
            <P className="my-2 text-sm text-muted-foreground text-center">
              Downloads typically take 2-5 minutes. If you close the app, you
              can resume the download by starting the installation again—no
              progress lost.
            </P>

            <Button
              size="sm"
              disabled={isDownloading || isOllamaDisconnected}
              onClick={handleDownload}
            >
              Install Models
            </Button>

            <AdvancedOptionsDialog
              triggerButton={
                <Button disabled={isDownloading} size="sm" variant="ghost">
                  Advanced Options
                </Button>
              }
              open={showAdvancedOptions}
              onOpenChange={setShowAdvancedOptions}
              onSubmit={handleAdvancedOptionsSubmit}
              defaultUrl={ollamaUrl}
            />
          </div>
        )}
      </div>
    </div>
  )
}

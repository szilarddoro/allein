import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { H1, H2, H3, P } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { useOllamaModels } from '@/lib/ollama/useOllamaModels'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useDebounceCallback } from 'usehooks-ts'
import { getAppVersion, getAppName } from '@/lib/version'
import { Separator } from '@/components/ui/separator'
import { useConfig } from '@/lib/db/useConfig'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { ModelListItem } from './ModelListItem'
import { toast } from 'sonner'
import { ActivityIndicator } from '@/components/ActivityIndicator'

export function SettingsPage() {
  const { data: config, refetch: refetchConfig } = useConfig()
  const { mutate: updateConfig } = useUpdateConfig({
    onSuccess: refetchConfig,
  })

  const ollamaUrl = config?.find((c) => c.key === 'ollama_url')?.value || null

  const selectedOllamaModel =
    config?.find((c) => c.key === 'ollama_model')?.value || null

  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useOllamaModels(ollamaUrl)

  const {
    data: isConnected,
    isLoading: connectionLoading,
    refetch: testConnection,
  } = useOllamaConnection(ollamaUrl)

  const handleUpdateOllamaUrl = useDebounceCallback((value: string) => {
    updateConfig({ key: 'ollama_url', value: value })
  }, 500)

  function handleSelectModel(modelName: string) {
    updateConfig({ key: 'ollama_model', value: modelName })
  }

  async function handleRefetchModels() {
    await refetchModels()
    toast.success('Models refreshed successfully')
  }

  async function handleTestConnection() {
    try {
      const { data: isConnected } = await testConnection()

      if (isConnected) {
        toast.success('Connected to Ollama')
      } else {
        toast.error('Failed to connect to Ollama')
      }
    } catch {
      toast.error('Failed to connect to Ollama')
    }
  }

  return (
    <div className="overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-start gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 hover:underline focus:ring-[3px] focus:ring-ring/50 focus:outline-none rounded-sm px-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the editor
          </Link>

          <H1 className="mb-0">Settings</H1>
        </div>

        <section>
          <Card>
            <CardHeader className="gap-0">
              <CardTitle>
                <H2 className="text-xl">AI Assistant</H2>
              </CardTitle>
              <CardDescription>
                <P className="!mt-0.5 text-muted-foreground text-sm">
                  Configure AI features and Ollama integration
                </P>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <H3 className="text-lg">Ollama Server</H3>
                  <div className="flex items-center gap-2">
                    {connectionLoading ? (
                      <ActivityIndicator srOnly>
                        Checking connection...
                      </ActivityIndicator>
                    ) : isConnected ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Disconnected</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleTestConnection}
                      disabled={connectionLoading}
                    >
                      <span className="sr-only">Test Connection</span>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ollama-url">Server URL</Label>
                  <Input
                    id="ollama-url"
                    defaultValue={ollamaUrl || undefined}
                    onChange={(e) => handleUpdateOllamaUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <H3 className="text-lg">Available Models</H3>

                  <div className="flex items-center gap-2">
                    {modelsLoading && (
                      <ActivityIndicator srOnly>
                        Loading models...
                      </ActivityIndicator>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefetchModels}
                      disabled={modelsLoading}
                    >
                      <span className="sr-only">Refresh Models</span>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {modelsLoading ? (
                  <ActivityIndicator>Loading models...</ActivityIndicator>
                ) : modelsError ? (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>
                      Failed to load models. Make sure Ollama is running.
                    </span>
                  </div>
                ) : models && models.length > 0 ? (
                  <div className="space-y-2">
                    {models.map((model) => (
                      <ModelListItem
                        key={model.name}
                        model={model}
                        isSelected={selectedOllamaModel === model.name}
                        onSelect={handleSelectModel}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <P>No models found. Pull a model first using:</P>
                    <code className="block mt-2 p-2 bg-muted rounded text-sm">
                      ollama pull gemma2:2b
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="gap-0">
              <CardTitle>
                <H2 className="text-xl">About</H2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between items-center gap-4">
                <span className="font-medium text-sm">Name</span>
                <span className="text-muted-foreground text-sm">
                  {getAppName()}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center gap-4">
                <span className="font-medium text-sm">Version</span>
                <span className="text-muted-foreground text-sm">
                  {getAppVersion()}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

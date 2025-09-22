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
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router'
import { useOllamaModels, useOllamaConnection } from '@/hooks/useOllamaModels'
import { useDebounceValue } from 'usehooks-ts'
import { getAppVersion, getAppName } from '@/lib/version'
import { useDatabase } from '@/hooks/useDatabase'
import { Separator } from '@/components/ui/separator'

export function SettingsPage() {
  const { data: database } = useDatabase()
  const [ollamaUrl, setOllamaUrl] = useDebounceValue(
    'http://localhost:11434',
    500,
  )

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

  return (
    <div className="overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <H3 className="text-lg">Ollama Server</H3>
                  <div className="flex items-center gap-2">
                    {connectionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
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
                      onClick={() => testConnection()}
                      disabled={connectionLoading}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ollama-url">Server URL</Label>
                  <Input
                    id="ollama-url"
                    defaultValue={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <H3 className="text-lg">Available Models</H3>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchModels()}
                    disabled={modelsLoading}
                  >
                    {modelsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {modelsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading models...</span>
                  </div>
                ) : modelsError ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span>
                      Failed to load models. Make sure Ollama is running.
                    </span>
                  </div>
                ) : models && models.length > 0 ? (
                  <div className="space-y-2">
                    {models.map((model) => (
                      <div
                        key={model.name}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Size: {(model.size / 1024 / 1024 / 1024).toFixed(2)}{' '}
                            GB
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
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

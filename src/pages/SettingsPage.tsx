import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export function SettingsPage() {
  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/">
              <span className="sr-only">Back to editor</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure your allein.app preferences
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {/* Editor Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
              <CardDescription>
                Customize your writing experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Editor settings will be available in a future update.
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Theme and appearance settings will be available in a future
                update.
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Configure AI features and Ollama integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                AI settings will be available when Ollama integration is
                implemented.
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Information about allein.app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Version:</strong> 0.1.0
                </div>
                <div className="text-sm">
                  <strong>Description:</strong> A modern markdown editor with
                  live preview
                </div>
                <div className="text-sm">
                  <strong>Built with:</strong> Tauri, React, TypeScript,
                  Tailwind CSS
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { H2, P } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'

export function AppearanceCard() {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>
          <H2 className="text-xl mb-0">Appearance</H2>
        </CardTitle>
        <CardDescription>
          <P className="my-0 text-muted-foreground text-sm">
            Customize the appearance of the application.
          </P>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Theme</Label>
            <P className="text-muted-foreground text-sm mb-3 mt-1">
              Choose your preferred theme for the application.
            </P>

            <ToggleGroup
              type="single"
              variant="outline"
              value={theme}
              onValueChange={(value) => {
                if (value) setTheme(value)
              }}
            >
              <ToggleGroupItem
                value="light"
                aria-label="Light theme"
                className="gap-2"
              >
                <Sun className="size-4" />
                Light
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dark"
                aria-label="Dark theme"
                className="gap-2"
              >
                <Moon className="size-4" />
                Dark
              </ToggleGroupItem>
              <ToggleGroupItem
                value="system"
                aria-label="System theme"
                className="gap-2"
              >
                <Monitor className="size-4" />
                System
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

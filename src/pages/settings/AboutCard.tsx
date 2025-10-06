import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { H2 } from '@/components/ui/typography'
import { getAppVersion, getAppName } from '@/lib/version'

export function AboutCard() {
  return (
    <Card>
      <CardHeader className="gap-0">
        <CardTitle>
          <H2 className="text-xl mb-0">About</H2>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ul className="flex flex-col divide-y">
          <li className="flex justify-between items-center gap-2 py-2">
            <span className="font-medium text-sm">Name</span>
            <span className="text-muted-foreground text-sm">
              {getAppName()}
            </span>
          </li>
          <li className="flex justify-between items-center gap-4 py-2">
            <span className="font-medium text-sm">Version</span>
            <span className="text-muted-foreground text-sm">
              {getAppVersion()}
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}

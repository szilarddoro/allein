import { AboutDetails } from '@/components/settings/AboutDetails'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { H2 } from '@/components/ui/typography'

export function AboutCard() {
  return (
    <Card>
      <CardHeader className="gap-0">
        <CardTitle>
          <H2 className="text-xl mb-0">About</H2>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <AboutDetails />
      </CardContent>
    </Card>
  )
}

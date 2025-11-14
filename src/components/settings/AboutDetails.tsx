import { ReportBugButton } from '@/lib/report/ReportBugButton'
import { getAppVersion, getAppLicense } from '@/lib/version'

export function AboutDetails() {
  return (
    <div className="flex flex-col gap-1.5 justify-center items-center">
      <ul className="flex flex-col divide-y w-full">
        <li className="flex justify-between items-center gap-4 py-2 min-h-[49px]">
          <span className="font-medium text-sm">Version</span>
          <span className="text-muted-foreground text-sm">
            {getAppVersion()}
          </span>
        </li>

        <li className="flex justify-between items-center gap-4 py-2 min-h-[49px]">
          <span className="font-medium text-sm">License</span>
          <span className="text-muted-foreground text-sm">
            {getAppLicense()}
          </span>
        </li>
      </ul>

      <ReportBugButton />
    </div>
  )
}

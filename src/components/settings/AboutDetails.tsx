import { getAppVersion } from '@/lib/version'

export function AboutDetails() {
  return (
    <ul className="flex flex-col divide-y">
      <li className="flex justify-between items-center gap-4 py-2 min-h-[49px]">
        <span className="font-medium text-sm">Version</span>
        <span className="text-muted-foreground text-sm">{getAppVersion()}</span>
      </li>
      <li className="flex justify-between items-center gap-4 py-2 min-h-[49px]">
        <span className="font-medium text-sm">License</span>
        <span className="text-muted-foreground text-sm">MIT</span>
      </li>
    </ul>
  )
}

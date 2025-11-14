import { getLogs } from '@/lib/logging/loggingUtils'
import { openUrl } from '@tauri-apps/plugin-opener'
import { toast } from 'sonner'

export async function reportBug() {
  try {
    const [mostRecentLog] = await getLogs()

    const subject = encodeURIComponent('Allein Bug')
    const body = encodeURIComponent(
      `Hi!\n\nI made these steps:\n\n\nI see these issues:\n\n\nHere is some help to debug:\n\n\nMost recent logs:\n\n${mostRecentLog || ''}\n\n`,
    )
    await openUrl(
      `mailto:doroszilard@gmail.com?subject=${subject}&body=${body}`,
    )
  } catch {
    toast.error('Failed to open the email client. Please try again.')
  }
}

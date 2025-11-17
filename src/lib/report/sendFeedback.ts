import { getLogs } from '@/lib/logging/loggingUtils'
import { openUrl } from '@tauri-apps/plugin-opener'
import { toast } from 'sonner'

export async function sendFeedback() {
  try {
    const [mostRecentLog] = await getLogs()

    const moodSection = `How are you feeling?

[ ] 😠 Frustrated
[ ] 😞 Disappointed
[ ] 😐 Neutral
[ ] 🙂 Happy
[ ] 🤩 Impressed`

    const rawBody = `Hi!

${moodSection}

How do you like the product? (Optional)


Do you have any improvement ideas? (Optional)


Have you found any bugs? (Optional)


Most recent logs:

${mostRecentLog || ''}`

    const subject = encodeURIComponent('Allein Feedback')
    const body = encodeURIComponent(rawBody)
    await openUrl(
      `mailto:doroszilard@gmail.com?subject=${subject}&body=${body}`,
    )
  } catch {
    toast.error('Failed to open the email client. Please try again.')
  }
}

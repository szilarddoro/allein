import { invoke } from '@tauri-apps/api/core'
import { revealItemInDir } from '@tauri-apps/plugin-opener'

/**
 * Get all log files from the backend
 */
export async function getLogs(): Promise<string[]> {
  try {
    return await invoke<string[]>('get_logs')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get logs:', error)
    return []
  }
}

/**
 * Get the logs folder path
 */
export async function getLogsFolder(): Promise<string> {
  try {
    return await invoke<string>('get_logs_folder')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get logs folder:', error)
    return ''
  }
}

/**
 * Open the logs folder in the system file explorer
 */
export async function openLogsFolder(): Promise<void> {
  const logsFolder = await getLogsFolder()
  if (logsFolder) {
    try {
      await revealItemInDir(logsFolder)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open logs folder:', error)
    }
  }
}

/**
 * Export all logs as a combined text file
 */
export async function exportLogs(): Promise<string> {
  const logs = await getLogs()
  if (logs.length === 0) {
    return 'No logs available'
  }

  // Combine all logs with separators
  const combined = logs
    .map((log, index) => {
      return `=== Log File ${index + 1} ===\n${log}`
    })
    .join('\n\n')

  return combined
}

/**
 * Download logs as a text file
 */
export async function downloadLogs(): Promise<void> {
  const logs = await exportLogs()

  // Create a blob with the log content
  const blob = new Blob([logs], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  // Create and trigger download
  const a = document.createElement('a')
  a.href = url
  a.download = `allein-logs-${new Date().toISOString().slice(0, 10)}.log`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

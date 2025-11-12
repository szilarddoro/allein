import { invoke } from '@tauri-apps/api/core'
import { useCallback } from 'react'

export interface LogContext {
  [key: string]: unknown
}

export function useLogger() {
  const logEvent = useCallback(
    async (
      level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
      category: string,
      message: string,
      context?: LogContext,
    ) => {
      try {
        await invoke('log_event', {
          level,
          category,
          message,
          context: context ? JSON.stringify(context) : null,
        })
      } catch (error) {
        // Silently fail if logging fails - don't break app functionality
        // eslint-disable-next-line no-console
        console.error('Failed to log event:', error)
      }
    },
    [],
  )

  return {
    info: (category: string, message: string, context?: LogContext) =>
      logEvent('INFO', category, message, context),
    warn: (category: string, message: string, context?: LogContext) =>
      logEvent('WARN', category, message, context),
    error: (category: string, message: string, context?: LogContext) =>
      logEvent('ERROR', category, message, context),
    debug: (category: string, message: string, context?: LogContext) =>
      logEvent('DEBUG', category, message, context),
  }
}

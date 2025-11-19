import { invoke } from '@tauri-apps/api/core'
import { useCallback, useMemo } from 'react'

export interface LogContext {
  [key: string]: unknown
}

export async function logEvent(
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  category: string,
  message: string,
  context?: LogContext,
) {
  try {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(level, category, message, context)
    }

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
}

export function useLogger() {
  const info = useCallback(
    (category: string, message: string, context?: LogContext) =>
      logEvent('INFO', category, message, context),
    [],
  )

  const warn = useCallback(
    (category: string, message: string, context?: LogContext) =>
      logEvent('WARN', category, message, context),
    [],
  )

  const error = useCallback(
    (category: string, message: string, context?: LogContext) =>
      logEvent('ERROR', category, message, context),
    [],
  )

  const debug = useCallback(
    (category: string, message: string, context?: LogContext) =>
      logEvent('DEBUG', category, message, context),
    [],
  )

  return useMemo(
    () => ({ info, warn, error, debug }),
    [debug, error, info, warn],
  )
}

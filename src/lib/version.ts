// Declare global variables injected by Vite
declare const __APP_VERSION__: string

// Get app version from package.json
export function getAppVersion(): string {
  try {
    return __APP_VERSION__ || 'n/a'
  } catch {
    return 'n/a'
  }
}

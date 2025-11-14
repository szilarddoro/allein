// Declare global variables injected by Vite
declare const __APP_VERSION__: string
declare const __APP_LICENSE__: string

// Get app version from package.json
export function getAppVersion(): string {
  try {
    return __APP_VERSION__ || 'n/a'
  } catch {
    return 'n/a'
  }
}

// Get app license from package.json
export function getAppLicense(): string {
  try {
    return __APP_LICENSE__ || 'n/a'
  } catch {
    return 'n/a'
  }
}
